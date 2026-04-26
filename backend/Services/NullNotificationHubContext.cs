namespace SalesSystem.Services;

/// <summary>
/// Default no-op implementation of INotificationHubContext.
/// Real-time notifications are not sent when SignalR is not configured.
/// </summary>
public class NullNotificationHubContext : INotificationHubContext
{
    public Task SendToUser(Guid userId, string method, object? message)
    {
        // No-op: SignalR not configured
        return Task.CompletedTask;
    }
}