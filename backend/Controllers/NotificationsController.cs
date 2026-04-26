using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<NotificationListResponse>> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false)
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.GetNotificationsAsync(userId, page, pageSize, unreadOnly);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountResponse>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(result);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAsReadAsync(id, userId);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAllAsReadAsync(userId);
        return NoContent();
    }

    [HttpGet("settings")]
    public async Task<ActionResult<NotificationSettingsResponse>> GetSettings()
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.GetSettingsAsync(userId);
        return Ok(result);
    }

    [HttpPost("settings")]
    public async Task<ActionResult<NotificationSettingsResponse>> UpdateSettings([FromBody] NotificationSettingsRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _notificationService.UpdateSettingsAsync(userId, request);
        return Ok(result);
    }
}