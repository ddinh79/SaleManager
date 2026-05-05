using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Hubs;

public class TranslationHub : Hub
{
    // Hub for broadcasting translation updates to all connected clients
    // Clients subscribe on /admin/i18n page mount
    // No special groups needed - all admins see all translations

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}