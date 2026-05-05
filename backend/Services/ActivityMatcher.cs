using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class ActivityMatcher
{
    private readonly AppDbContext _context;
    private readonly IActivityRepository _activityRepo;

    // Matching window: ±2 hours
    private const int MATCH_WINDOW_HOURS = 2;

    // Activity type mapping
    private static readonly Dictionary<string, List<ActivityType>> TaskTypeMapping = new()
    {
        { "CALL", new List<ActivityType> { ActivityType.CALL } },
        { "FOLLOW_UP", new List<ActivityType> { ActivityType.CALL, ActivityType.MESSAGE } },
        { "MEETING", new List<ActivityType> { ActivityType.MEETING } },
        { "DEMO", new List<ActivityType> { ActivityType.DEMO } },
        { "SAMPLE", new List<ActivityType> { ActivityType.SAMPLE_SENT } },
    };

    public ActivityMatcher(AppDbContext context, IActivityRepository activityRepo)
    {
        _context = context;
        _activityRepo = activityRepo;
    }

    public async Task<ActivityMatchResult?> FindMatchingActivityAsync(DailyPlanTask task)
    {
        if (!TaskTypeMapping.TryGetValue(task.TaskType, out var validTypes))
            return null;

        var windowStart = task.PlannedStart.AddHours(-MATCH_WINDOW_HOURS);
        var windowEnd = task.PlannedStart.AddHours(MATCH_WINDOW_HOURS);

        // Find activities within window
        var activities = await _context.Activities
            .Where(a => a.SalesId == task.DailyPlan.SalesId)
            .Where(a => a.DoctorId == task.DoctorId)
            .Where(a => validTypes.Contains(a.Type))
            .Where(a => a.CreatedAt >= windowStart && a.CreatedAt <= windowEnd)
            .OrderBy(a => Math.Abs((a.CreatedAt - task.PlannedStart).TotalMinutes))
            .FirstOrDefaultAsync();

        if (activities == null)
            return null;

        // Anti-fake checks
        var isValid = ValidateActivity(activities);
        if (!isValid.IsValid)
            return new ActivityMatchResult { Activity = activities, IsLowConfidence = true };

        return new ActivityMatchResult { Activity = activities, IsLowConfidence = false };
    }

private ActivityValidationResult ValidateActivity(Activity activity)
    {
        // Content check for CALL activities - must have meaningful content
        if (activity.Type == ActivityType.CALL && string.IsNullOrWhiteSpace(activity.Content))
            return new ActivityValidationResult { IsValid = false, Reason = "no_content" };

        // GPS mismatch check for MEETING/DEMO
        if ((activity.Type == ActivityType.MEETING || activity.Type == ActivityType.DEMO)
            && !string.IsNullOrEmpty(activity.GpsResult)
            && activity.GpsResult != "OK")
            return new ActivityValidationResult { IsValid = true, IsSuspicious = true };

        return new ActivityValidationResult { IsValid = true };
    }

public async Task UpdateMetricsAfterCompletionAsync(Guid userId, bool isAuto, bool isManual)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(userId);
        if (metrics == null) return;

        if (isAuto)
            metrics.TasksCompleted7d++;
        else if (isManual)
            metrics.TasksCompletedManually7d++;

        // Recalculate 7-day completion rate
        metrics.CompletionRate7d = CalculateCompletionRate(metrics);

        await _context.SaveChangesAsync();
    }

    private decimal CalculateCompletionRate(UserPlanMetrics metrics)
    {
        var totalQuality = metrics.TasksCompleted7d * 1.0m + metrics.TasksCompletedManually7d * 0.5m + metrics.TasksSkipped7d * 0.2m;
        var totalPossible = metrics.TasksCompleted7d + metrics.TasksCompletedManually7d + metrics.TasksSkipped7d;
        return totalPossible > 0 ? totalQuality / totalPossible : 0m;
    }
}

public class ActivityMatchResult
{
    public Activity Activity { get; set; } = null!;
    public bool IsLowConfidence { get; set; }
}

public class ActivityValidationResult
{
    public bool IsValid { get; set; }
    public bool IsSuspicious { get; set; }
    public string Reason { get; set; } = "";
}