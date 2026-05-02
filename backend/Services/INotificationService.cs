using SalesSystem.DTOs;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public interface INotificationService
{
    Task<NotificationListResponse> GetNotificationsAsync(Guid userId, int page, int pageSize, bool unreadOnly);
    Task<UnreadCountResponse> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<NotificationSettingsResponse> GetSettingsAsync(Guid userId);
    Task<NotificationSettingsResponse> UpdateSettingsAsync(Guid userId, NotificationSettingsRequest request);
    Task CreateNotificationAsync(Guid userId, NotificationType type, string title, string message, Guid? referenceId, string? referenceType, NotificationPriority priority);
    Task<bool> ShouldCreateNotificationAsync(Guid userId, NotificationType type);
    Task CreateDedupEntryAsync(Guid userId, NotificationType type);
    Task EnsureSettingsExistAsync(Guid userId);

    /// <summary>
    /// Atomically creates a notification with dedup check to prevent race condition duplicates.
    /// Returns true if notification was created, false if dedup prevented it.
    /// </summary>
    Task<bool> TryCreateNotificationAsync(Guid userId, NotificationType type, string title, string message, Guid? referenceId, string? referenceType, NotificationPriority priority);
}