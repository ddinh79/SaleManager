using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class CapacityCalculator
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepo;

    // Guardrails
    private const int MIN_MUST_DO = 3;
    private const int MAX_MUST_DO = 8;
    private const int MIN_SHOULD_DO = 5;
    private const int MAX_SHOULD_DO = 15;
    private const int MAX_TOTAL = 20;
    private const decimal MIN_OVERRIDE = 0.8m;
    private const decimal MAX_OVERRIDE = 1.2m;

    public CapacityCalculator(AppDbContext context, IUserRepository userRepo)
    {
        _context = context;
        _userRepo = userRepo;
    }

    public async Task<UserPlanSettings> GetOrCreateSettingsAsync(Guid userId)
    {
        var settings = await _context.UserPlanSettings.FindAsync(userId);
        if (settings == null)
        {
            settings = new UserPlanSettings { UserId = userId };
            _context.UserPlanSettings.Add(settings);
            await _context.SaveChangesAsync();
        }
        return settings;
    }

    public async Task<UserPlanMetrics> GetOrCreateMetricsAsync(Guid userId)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(userId);
        if (metrics == null)
        {
            metrics = new UserPlanMetrics { UserId = userId };
            _context.UserPlanMetrics.Add(metrics);
            await _context.SaveChangesAsync();
        }
        return metrics;
    }

    public async Task<CapacityInfo> CalculateCapacityAsync(Guid userId)
    {
        var settings = await GetOrCreateSettingsAsync(userId);
        var metrics = await GetOrCreateMetricsAsync(userId);

        // Calculate base from 7-day average
        var baseCapacity = CalculateBaseCapacity(settings.AvgTasksPerDay);

        // Apply override if set
        var mustDo = baseCapacity.MustDo;
        var shouldDo = baseCapacity.ShouldDo;

        if (settings.CapacityMultiplierOverride.HasValue)
        {
            var multiplier = Math.Clamp(settings.CapacityMultiplierOverride.Value, MIN_OVERRIDE, MAX_OVERRIDE);
            mustDo = (int)Math.Round(mustDo * multiplier);
            shouldDo = (int)Math.Round(shouldDo * multiplier);
        }

        // Apply recovery/stretch mode adjustment
        var mode = "NORMAL";
        if (metrics.IsRecoveryMode)
        {
            mustDo = (int)Math.Round(mustDo * 0.7);
            shouldDo = (int)Math.Round(shouldDo * 0.7);
            mode = "RECOVERY";
        }
        else if (metrics.CompletionRate7d > 0.9m)
        {
            mustDo = (int)Math.Round(mustDo * 1.1);
            shouldDo = (int)Math.Round(shouldDo * 1.1);
            mode = "STRETCH";
        }

        // Apply guardrails
        mustDo = Math.Clamp(mustDo, MIN_MUST_DO, MAX_MUST_DO);
        shouldDo = Math.Clamp(shouldDo, MIN_SHOULD_DO, MAX_SHOULD_DO);
        shouldDo = Math.Min(shouldDo, MAX_TOTAL - mustDo);

        return new CapacityInfo
        {
            MustDoLimit = mustDo,
            ShouldDoLimit = shouldDo,
            StartTime = settings.PreferredStartTime ?? new DateTime(2001, 1, 1, 9, 0, 0),
            Mode = mode
        };
    }

    private BaseCapacity CalculateBaseCapacity(decimal avgTasksPerDay)
    {
        var mustDo = (int)Math.Round(avgTasksPerDay * 0.4m);
        var shouldDo = (int)Math.Round(avgTasksPerDay * 0.8m);

        return new BaseCapacity
        {
            MustDo = Math.Clamp(mustDo, MIN_MUST_DO, MAX_MUST_DO),
            ShouldDo = Math.Clamp(shouldDo, MIN_SHOULD_DO, MAX_SHOULD_DO)
        };
    }

    private class BaseCapacity
    {
        public int MustDo { get; set; }
        public int ShouldDo { get; set; }
    }
}