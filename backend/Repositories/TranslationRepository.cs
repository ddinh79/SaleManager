using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class TranslationRepository : Repository<TranslationKey>, ITranslationRepository
{
    public TranslationRepository(AppDbContext context) : base(context) { }

    public async Task<Dictionary<string, string>> GetTranslationsByLocaleAsync(string locale)
    {
        return await _dbSet
            .Where(tk => !tk.IsDeleted)
            .SelectMany(tk => tk.Translations.Where(t => t.Locale == locale), (tk, t) => new { tk.Key, t.Value })
            .ToDictionaryAsync(x => x.Key, x => x.Value);
    }

    public async Task<int> GetVersionAsync(string locale)
    {
        var version = await _context.Set<I18nVersion>().FindAsync(locale);
        return version?.Version ?? 1;
    }

    public async Task<Translation?> GetTranslationAsync(string key, string locale)
    {
        return await _context.Translations
            .Include(t => t.TranslationKey)
            .FirstOrDefaultAsync(t => t.TranslationKey.Key == key && t.Locale == locale && !t.TranslationKey.IsDeleted);
    }

    public async Task<bool> ExistsAsync(string key)
    {
        return await _dbSet.AnyAsync(tk => tk.Key == key && !tk.IsDeleted);
    }

    public async Task<List<TranslationKey>> GetKeysWithMissingTranslationsAsync(string locale)
    {
        return await _dbSet
            .Where(tk => !tk.IsDeleted)
            .Where(tk => !tk.Translations.Any(t => t.Locale == locale))
            .ToListAsync();
    }

    public async Task UpsertTranslationAsync(string key, string locale, string value)
    {
        var translationKey = await _dbSet.Include(tk => tk.Translations).FirstOrDefaultAsync(tk => tk.Key == key);
        if (translationKey == null) return;

        var translation = translationKey.Translations.FirstOrDefault(t => t.Locale == locale);
        if (translation == null)
        {
            translation = new Translation
            {
                TranslationKeyId = translationKey.Id,
                Locale = locale,
                Value = value,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Translations.Add(translation);
        }
        else
        {
            translation.Value = value;
            translation.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task CreateKeyWithTranslationsAsync(TranslationKey translationKey, Dictionary<string, string> initialValues)
    {
        await _dbSet.AddAsync(translationKey);
        await _context.SaveChangesAsync();

        foreach (var (locale, value) in initialValues)
        {
            var translation = new Translation
            {
                TranslationKeyId = translationKey.Id,
                Locale = locale,
                Value = value,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Translations.Add(translation);
        }

        await _context.SaveChangesAsync();
    }

    public async Task SoftDeleteAsync(Guid id)
    {
        var entity = await _dbSet.FindAsync(id);
        if (entity != null)
        {
            entity.IsDeleted = true;
            entity.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task LogAuditAsync(Guid translationKeyId, string locale, string? oldValue, string newValue, Guid userId)
    {
        var audit = new TranslationAuditLog
        {
            TranslationKeyId = translationKeyId,
            Locale = locale,
            OldValue = oldValue,
            NewValue = newValue,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        _context.TranslationAuditLogs.Add(audit);
        await _context.SaveChangesAsync();
    }
}