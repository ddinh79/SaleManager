using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public class AntiGamingMonitor
{
    private readonly AppDbContext _context;

    private const decimal SUSPICIOUS_ACTIVITY_RATE_THRESHOLD = 0.3m;
    private const decimal MANUAL_COMPLETION_RATIO_THRESHOLD = 0.5m;
    private const decimal SKIP_RATE_THRESHOLD = 0.3m;

    public AntiGamingMonitor(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UserPlanMetrics> CheckAndFlagAsync(Guid userId)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(userId);
        if (metrics == null)
            return CreateDefaultMetrics(userId);

        // Check suspicious activity rate
        var totalActivities = await _context.Activities
            .Where(a => a.SalesId == userId)
            .Where(a => a.CreatedAt >= DateTime.UtcNow.AddDays(-7))
            .CountAsync();

        var suspiciousRate = totalActivities > 0
            ? (decimal)metrics.SuspiciousActivityCount / totalActivities
            : 0m;

        if (suspiciousRate > SUSPICIOUS_ACTIVITY_RATE_THRESHOLD)
        {
            FlagUser(metrics, "suspicious_activity", "Suspicious activity rate exceeds 30%");
            return metrics;
        }

        // Check manual completion ratio
        var totalCompleted = metrics.TasksCompleted7d + metrics.TasksCompletedManually7d;
        if (totalCompleted > 0)
        {
            var manualRatio = (decimal)metrics.TasksCompletedManually7d / totalCompleted;
            if (manualRatio > MANUAL_COMPLETION_RATIO_THRESHOLD)
            {
                // Reduce manual weight impact
                metrics.SuspiciousReason = "manual_ratio_high";
            }
        }

        // Check skip rate
        var totalTasks = metrics.TasksCompleted7d + metrics.TasksCompletedManually7d + metrics.TasksSkipped7d;
        if (totalTasks > 0)
        {
            var skipRate = (decimal)metrics.TasksSkipped7d / totalTasks;
            if (skipRate > SKIP_RATE_THRESHOLD)
            {
                FlagUser(metrics, "skip_rate_high", "Skip rate exceeds 30%");
            }
        }

        await _context.SaveChangesAsync();
        return metrics;
    }

    public async Task RecordSuspiciousActivityAsync(Guid salesId)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(salesId);
        if (metrics == null) return;

        metrics.SuspiciousActivityCount++;
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ShouldExcludeFromCapacityAsync(Guid userId)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(userId);
        return metrics?.IsSuspicious ?? false;
    }

    private void FlagUser(UserPlanMetrics metrics, string reason, string description)
    {
        metrics.IsSuspicious = true;
        metrics.SuspiciousReason = reason;
        metrics.FlaggedAt = DateTime.UtcNow;
    }

    private UserPlanMetrics CreateDefaultMetrics(Guid userId)
    {
        var metrics = new UserPlanMetrics
        {
            UserId = userId,
            CompletionRate7d = 0,
            IsRecoveryMode = false
        };
        _context.UserPlanMetrics.Add(metrics);
        return metrics;
    }
}