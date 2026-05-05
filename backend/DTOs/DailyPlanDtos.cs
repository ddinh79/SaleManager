namespace SalesSystem.DTOs;

public class DailyPlanResponse
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Status { get; set; } = "";
    public Guid? ActiveTaskId { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal ConfidenceScore { get; set; }
    public bool IsRecoveryMode { get; set; }
    public CapacityInfo Capacity { get; set; } = new();
    public List<DailyPlanTaskDto> MustDo { get; set; } = new();
    public List<DailyPlanTaskDto> ShouldDo { get; set; } = new();
    public List<DailyPlanTaskDto> NiceToHave { get; set; } = new();
}

public class DailyPlanTaskDto
{
    public Guid Id { get; set; }
    public DateTime PlannedStart { get; set; }
    public DateTime? ActualStart { get; set; }
    public int DelayMinutes { get; set; }
    public int PlannedDurationMinutes { get; set; }
    public string Category { get; set; } = "";
    public int Score { get; set; }
    public string Status { get; set; } = "";
    public bool IsLowConfidence { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = "";
    public string HospitalName { get; set; } = "";
    public string TaskType { get; set; } = "";
    public decimal? DealValue { get; set; }
    public string Temperature { get; set; } = "";
}

public class CapacityInfo
{
    public int MustDoLimit { get; set; }
    public int ShouldDoLimit { get; set; }
    public DateTime StartTime { get; set; }
    public string Mode { get; set; } = "NORMAL"; // NORMAL, RECOVERY, STRETCH
}

public class ManualCompleteRequest
{
    public string ReasonCode { get; set; } = "";
    public string Note { get; set; } = "";
}

public class SkipTaskRequest
{
    public string ReasonCode { get; set; } = "";
    public string Note { get; set; } = "";
}

public class CapacityUpdateRequest
{
    public decimal? CapacityMultiplierOverride { get; set; }
    public DateTime? PreferredStartTime { get; set; }
}

public class TeamDailyPlanResponse
{
    public DateTime Date { get; set; }
    public List<TeamMemberPlanDto> TeamPlans { get; set; } = new();
    public TeamSummaryDto Summary { get; set; } = new();
}

public class TeamMemberPlanDto
{
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = "";
    public string PlanStatus { get; set; } = "";
    public ActiveTaskDto ActiveTask { get; set; } = new();
    public int Completed { get; set; }
    public int MustDo { get; set; }
    public int OverdueCount { get; set; }
    public DateTime? LastActivityAt { get; set; }
}

public class ActiveTaskDto
{
    public string Task { get; set; } = "";
    public DateTime? StartedAt { get; set; }
}

public class TeamSummaryDto
{
    public int TeamOnTrack { get; set; }
    public int TeamOffTrack { get; set; }
    public int TeamNotStarted { get; set; }
    public int TotalCompleted { get; set; }
    public int TotalMustDo { get; set; }
}