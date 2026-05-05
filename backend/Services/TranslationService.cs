using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Hubs;
using SalesSystem.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Services;

public class TranslationService : ITranslationService
{
    private readonly AppDbContext _context;
    private readonly ITranslationRepository _repo;
    private readonly ITranslationCache _cache;
    private readonly IHubContext<TranslationHub>? _hubContext;

    public TranslationService(
        AppDbContext context,
        ITranslationRepository repo,
        ITranslationCache cache,
        IHubContext<TranslationHub>? hubContext = null)
    {
        _context = context;
        _repo = repo;
        _cache = cache;
        _hubContext = hubContext;
    }

    public async Task<I18nResponse?> GetTranslationsAsync(string locale, string? ns = null)
    {
        // Check cache first
        var cached = await _cache.GetAsync(locale);
        if (cached.HasValue)
        {
            var version = cached.Value.version;
            var data = JsonSerializer.Deserialize<Dictionary<string, string>>(cached.Value.data!);

            if (ns != null)
            {
                var nsList = ns.Split(',');
                data = data?.Where(kv => nsList.Any(n => kv.Key.StartsWith(n + "."))).ToDictionary(k => k.Key, k => k.Value);
            }

            return new I18nResponse { Version = version, Locale = locale, Data = data ?? new() };
        }

        // Cache miss - query DB
        var translations = await _repo.GetTranslationsByLocaleAsync(locale);

        if (ns != null)
        {
            var nsList = ns.Split(',');
            translations = translations.Where(kv => nsList.Any(n => kv.Key.StartsWith(n + "."))).ToDictionary(k => k.Key, k => k.Value);
        }

        var version_ = await _repo.GetVersionAsync(locale);
        var json = JsonSerializer.Serialize(translations);

        // Populate cache
        await _cache.SetAsync(locale, version_, json);

        return new I18nResponse { Version = version_, Locale = locale, Data = translations };
    }

    public async Task<TranslationKeyListResponse> GetKeysAsync()
    {
        var keys = await _context.TranslationKeys
            .Where(tk => !tk.IsDeleted)
            .Select(tk => new TranslationKeyResponse
            {
                Key = tk.Key,
                Category = tk.Category,
                Description = tk.Description,
                IsDeleted = tk.IsDeleted
            })
            .ToListAsync();

        return new TranslationKeyListResponse { Keys = keys };
    }

    public async Task<List<TranslationKeyResponse>> GetMissingKeysAsync(string locale)
    {
        var missing = await _repo.GetKeysWithMissingTranslationsAsync(locale);
        return missing.Select(tk => new TranslationKeyResponse
        {
            Key = tk.Key,
            Category = tk.Category,
            Description = tk.Description,
            IsDeleted = tk.IsDeleted
        }).ToList();
    }

    public async Task<TranslationUpdateResponse?> UpdateTranslationAsync(string key, string locale, string value, Guid userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var translation = await _repo.GetTranslationAsync(key, locale);
            if (translation == null) return null;

            var oldValue = translation.Value;
            translation.Value = value;
            translation.UpdatedAt = DateTime.UtcNow;

            // Increment version
            var versionEntity = await _context.I18nVersions.FindAsync(locale);
            if (versionEntity == null)
            {
                versionEntity = new I18nVersion { Locale = locale, Version = 1, UpdatedAt = DateTime.UtcNow };
                _context.I18nVersions.Add(versionEntity);
            }
            else
            {
                versionEntity.Version++;
                versionEntity.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Audit log
            await _repo.LogAuditAsync(translation.TranslationKeyId, locale, oldValue, value, userId);

            // Invalidate cache AFTER commit
            await _cache.InvalidateAsync(locale);

            // Broadcast via SignalR
            if (_hubContext != null)
            {
                await _hubContext.Clients.All.SendAsync("TranslationUpdated", new
                {
                    type = "TranslationUpdated",
                    key = key,
                    locale = locale,
                    value = value,
                    version = versionEntity.Version,
                    updatedAt = DateTime.UtcNow.ToString("o")
                });
            }

            return new TranslationUpdateResponse
            {
                Key = key,
                Locale = locale,
                Value = value,
                Version = versionEntity.Version,
                UpdatedAt = DateTime.UtcNow
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<TranslationKeyResponse> CreateKeyAsync(string key, string category, string? description, Dictionary<string, string>? initialValues, Guid userId)
    {
        var translationKey = new TranslationKey
        {
            Key = key,
            Category = category,
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.CreateKeyWithTranslationsAsync(translationKey, initialValues ?? new() { { "en", key.Split('.').Last() } });

        // Invalidate all locales cache
        await _cache.InvalidateAllAsync();

        // Broadcast
        if (_hubContext != null)
        {
            await _hubContext.Clients.All.SendAsync("TranslationCreated", new { key, category });
        }

        return new TranslationKeyResponse { Key = key, Category = category, Description = description, IsDeleted = false };
    }

    public async Task<int> BulkUpdateAsync(string locale, List<BulkTranslationChange> changes, Guid userId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            foreach (var change in changes)
            {
                await _repo.UpsertTranslationAsync(change.Key, locale, change.Value);
            }

            // Increment version
            var versionEntity = await _context.I18nVersions.FindAsync(locale);
            if (versionEntity == null)
            {
                versionEntity = new I18nVersion { Locale = locale, Version = 1, UpdatedAt = DateTime.UtcNow };
                _context.I18nVersions.Add(versionEntity);
            }
            else
            {
                versionEntity.Version++;
                versionEntity.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Invalidate cache
            await _cache.InvalidateAsync(locale);

            // Broadcast BULK event (one event instead of N events)
            if (_hubContext != null)
            {
                await _hubContext.Clients.All.SendAsync("TranslationBulkUpdated", new
                {
                    type = "TranslationBulkUpdated",
                    locale = locale,
                    version = versionEntity.Version
                });
            }

            return changes.Count;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task SoftDeleteKeyAsync(string key)
    {
        var translationKey = await _context.TranslationKeys.FirstOrDefaultAsync(tk => tk.Key == key);
        if (translationKey != null)
        {
            await _repo.SoftDeleteAsync(translationKey.Id);
            await _cache.InvalidateAllAsync();

            if (_hubContext != null)
            {
                await _hubContext.Clients.All.SendAsync("TranslationDeleted", new { key });
            }
        }
    }

    public async Task LogMissingKeyAsync(string key, string locale)
    {
        _context.TranslationMissingLogs.Add(new TranslationMissingLog
        {
            Key = key,
            Locale = locale,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }
}