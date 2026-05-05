using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class DailyPlan
{
    [Key]
    public Guid Id { get; set; }

    public Guid SalesId { get; set; }
    public User Sales { get; set; } = null!;

    public DateTime Date { get; set; }
    public DateTime GeneratedAt { get; set; }

    public int MustDoLimit { get; set; }
    public int ShouldDoLimit { get; set; }
    public DateTime StartTime { get; set; }

    public PlanStatus Status { get; set; } = PlanStatus.NOT_STARTED;
    public Guid? ActiveTaskId { get; set; }

    public decimal CompletionRate { get; set; }
    public decimal ConfidenceScore { get; set; }
    public bool IsRecoveryMode { get; set; }

    public ICollection<DailyPlanTask> Tasks { get; set; } = new List<DailyPlanTask>();
}

public enum PlanStatus
{
    ON_TRACK,
    OFF_TRACK,
    COMPLETED,
    NOT_STARTED
}