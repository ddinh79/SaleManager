namespace SalesSystem.Services;

/// <summary>
/// Abstraction over SignalR hub context for real-time notifications.
/// Allows NotificationService to send messages without direct SignalR dependency.
/// </summary>
public interface INotificationHubContext
{
    Task SendToUser(Guid userId, string method, object? message);
}