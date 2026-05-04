using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Hubs;

/// <summary>
/// SignalR hub for deal pipeline realtime updates.
/// Implements group-based broadcasting: users only receive updates for deals they have access to.
/// </summary>
public class DealHub : Hub
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DealHub(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Join pipeline group based on user's team scope.
    /// SalesMember: joins their own user group
    /// SalesManager: joins their team group
    /// Admin: joins a global pipeline group
    /// </summary>
    public async Task JoinPipeline()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var managerId = GetManagerId();

        if (role == "Admin")
        {
            // Admin sees all - join global group
            await Groups.AddToGroupAsync(Context.ConnectionId, "Pipeline_Admin");
        }
        else if (role == "SalesManager" && managerId.HasValue)
        {
            // Manager sees team - join team group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Pipeline_Team_{managerId}");
        }
        else if (role == "SalesMember" && userId.HasValue)
        {
            // SalesMember sees only own deals
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Pipeline_User_{userId}");
        }
    }

    /// <summary>
    /// Broadcast deal moved event to the appropriate group(s).
    /// Called by DealService after a stage change.
    /// </summary>
    public async Task NotifyDealMoved(Guid dealId, string fromStage, string toStage, Guid salesId, int version)
    {
        // Determine which group(s) should receive this update
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();
        var managerId = GetManagerId();

        // Build list of groups that should receive this deal's updates
        var targetGroups = new List<string>();

        // Admin gets all updates
        targetGroups.Add("Pipeline_Admin");

        // SalesManager gets updates for deals on their team
        if (role == "SalesManager" && managerId.HasValue)
        {
            targetGroups.Add($"Pipeline_Team_{managerId}");
        }

        // SalesMember gets updates for their own deals
        targetGroups.Add($"Pipeline_User_{salesId}");

        // Send to all relevant groups - deduplicate
        foreach (var group in targetGroups.Distinct())
        {
            await Clients.Group(group).SendAsync("DealMoved", new
            {
                type = "deal_moved",
                dealId = dealId.ToString(),
                fromStage,
                toStage,
                salesId = salesId.ToString(),
                version
            });
        }
    }

    /// <summary>
    /// Broadcast deal created event.
    /// </summary>
    public async Task NotifyDealCreated(Guid dealId, Guid salesId)
    {
        await BroadcastToRelevantGroups(new
        {
            type = "deal_created",
            dealId = dealId.ToString(),
            salesId = salesId.ToString()
        }, salesId);
    }

    /// <summary>
    /// Broadcast deal deleted event.
    /// </summary>
    public async Task NotifyDealDeleted(Guid dealId, Guid salesId)
    {
        await BroadcastToRelevantGroups(new
        {
            type = "deal_deleted",
            dealId = dealId.ToString(),
            salesId = salesId.ToString()
        }, salesId);
    }

    private async Task BroadcastToRelevantGroups(object message, Guid dealSalesId)
    {
        var groups = new List<string> { "Pipeline_Admin", $"Pipeline_User_{dealSalesId}" };
        foreach (var group in groups.Distinct())
        {
            await Clients.Group(group).SendAsync("DealEvent", message);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdStr, out var userId) ? userId : null;
    }

    private string GetCurrentUserRole()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value ?? "";
    }

    private Guid? GetManagerId()
    {
        // For SalesManager, the ManagerId is their own ID (they manage themselves + team)
        // We need to get the manager ID from the user's claims or lookup
        // This is simplified - in production you'd query the User entity
        var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst("ManagerId")?.Value;
        return Guid.TryParse(userIdStr, out var managerId) ? managerId : null;
    }
}
