using Microsoft.AspNetCore.SignalR;
using SalesSystem.Hubs;

namespace SalesSystem.Services;

public class NotificationHubContext : INotificationHubContext
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationHubContext(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUser(Guid userId, string method, object? message)
    {
        await _hubContext.Clients.Group($"User_{userId}").SendAsync(method, message);
    }
}