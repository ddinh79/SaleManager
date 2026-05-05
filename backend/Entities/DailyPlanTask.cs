using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Entities;

public class DailyPlanTask
{
    [Key]
    public Guid Id { get; set; }

    public Guid DailyPlanId { get; set; }
    public DailyPlan DailyPlan { get; set; } = null!;

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public Guid? DealId { get; set; }
    public Deal? Deal { get; set; }

    // Timing
    public DateTime PlannedStart { get; set; }
    public DateTime? ActualStart { get; set; }
    public int DelayMinutes { get; set; }
    public int PlannedDurationMinutes { get; set; }

    // Classification
    public string Category { get; set; } = ""; // MUST_DO, SHOULD_DO, NICE_TO_HAVE
    public int Score { get; set; }

    // State
    public PlanTaskStatus Status { get; set; } = PlanTaskStatus.PENDING;
    public Guid? CompletedActivityId { get; set; }
    public bool IsLowConfidence { get; set; }

    public string ManualReasonCode { get; set; } = "";
    public string ManualReasonNote { get; set; } = "";

    // Display info
    public string DoctorName { get; set; } = "";
    public string HospitalName { get; set; } = "";
    public string TaskType { get; set; } = "";
    public decimal? DealValue { get; set; }
    public string Temperature { get; set; } = "";
}

public enum PlanTaskStatus
{
    PENDING,
    IN_PROGRESS,
    COMPLETED_AUTO,
    COMPLETED_MANUAL,
    SKIPPED,
    EXPIRED,
    OFF_TRACK
}