namespace SalesSystem.DTOs;

public enum TaskType
{
    FOLLOW_UP,
    DEAL_CLOSING,
    DEAL_OVERDUE
}

public enum TaskPriority
{
    HIGH,
    MEDIUM,
    LOW
}

public class TaskItem
{
    public Guid Id { get; set; }
    public TaskType Type { get; set; }
    public TaskPriority Priority { get; set; }
    public int Score { get; set; }

    // Doctor info
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string HospitalName { get; set; } = string.Empty;
    public string Temperature { get; set; } = "WARM";

    // Deal info (nullable for FOLLOW_UP only)
    public Guid? DealId { get; set; }
    public string? DealName { get; set; }
    public decimal? DealValue { get; set; }
    public string? DealStage { get; set; }

    // Timing
    public DateTime DueAt { get; set; }
    public int OverdueDays { get; set; }
    public DateTime? LastActivityAt { get; set; }
}

public class TasksSummary
{
    public int Total { get; set; }
    public int Overdue { get; set; }
    public int ClosingSoon { get; set; }
    public int Today { get; set; }
}

public class TasksResponse
{
    public List<TaskItem> Tasks { get; set; } = new();
    public TasksSummary Summary { get; set; } = new();
}

public class SnoozeRequest
{
    public int Days { get; set; }
}

public enum TaskFilter
{
    ALL,
    OVERDUE,
    CLOSING_SOON,
    TODAY
}