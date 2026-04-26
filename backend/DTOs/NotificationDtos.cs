namespace SalesSystem.DTOs;

// === Request DTOs ===

public class NotificationSettingsRequest
{
    public bool FollowUpReminderEnabled { get; set; }
    public bool DealClosingEnabled { get; set; }
    public bool InactiveAlertEnabled { get; set; }
}

// === Response DTOs ===

public class NotificationResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public bool IsRead { get; set; }
    public string Priority { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class NotificationListResponse
{
    public List<NotificationResponse> Items { get; set; } = new();
    public int Total { get; set; }
    public int UnreadCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class UnreadCountResponse
{
    public int Count { get; set; }
}

public class NotificationSettingsResponse
{
    public bool FollowUpReminderEnabled { get; set; }
    public bool DealClosingEnabled { get; set; }
    public bool InactiveAlertEnabled { get; set; }
}