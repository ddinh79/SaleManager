using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class UserPlanMetrics
{
    [Key]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Rolling 7-day
    public int TasksCompleted7d { get; set; }
    public int TasksCompletedManually7d { get; set; }
    public int TasksSkipped7d { get; set; }
    public decimal CompletionRate7d { get; set; }

    // Yesterday
    public decimal CompletionRateYesterday { get; set; }
    public bool IsRecoveryMode { get; set; }

    // Anti-gaming
    public bool IsSuspicious { get; set; }
    public string SuspiciousReason { get; set; } = "";
    public DateTime? FlaggedAt { get; set; }
    public int SuspiciousActivityCount { get; set; }
}