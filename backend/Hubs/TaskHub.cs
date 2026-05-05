using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Hubs;

[Authorize]
public class TaskHub : Hub
{
    public async Task JoinUserGroup(Guid userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Tasks_User_{userId}");
    }

    public async Task LeaveUserGroup(Guid userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Tasks_User_{userId}");
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserIdFromToken();
        if (userId.HasValue)
        {
            await JoinUserGroup(userId.Value);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserIdFromToken();
        if (userId.HasValue)
        {
            await LeaveUserGroup(userId.Value);
        }
        await base.OnDisconnectedAsync(exception);
    }

    private Guid? GetUserIdFromToken()
    {
        var claim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : null;
    }
}