using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly INotificationHubContext _hubContext;

    public NotificationService(AppDbContext context, INotificationHubContext hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public async Task<NotificationListResponse> GetNotificationsAsync(Guid userId, int page, int pageSize, bool unreadOnly)
    {
        var query = _context.Notifications.Where(n => n.UserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var total = await query.CountAsync();
        var unreadCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

        var items = await query
            .OrderByDescending(n => n.Priority)
            .ThenByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                Type = n.Type.ToString(),
                Title = n.Title,
                Message = n.Message,
                ReferenceId = n.ReferenceId,
                ReferenceType = n.ReferenceType,
                IsRead = n.IsRead,
                Priority = n.Priority.ToString(),
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return new NotificationListResponse
        {
            Items = items,
            Total = total,
            UnreadCount = unreadCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<UnreadCountResponse> GetUnreadCountAsync(Guid userId)
    {
        var count = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
        return new UnreadCountResponse { Count = count };
    }

    public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
            await _hubContext.SendToUser(userId, "UpdateUnreadCount",
                await GetUnreadCountAsync(userId));
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
            n.IsRead = true;

        await _context.SaveChangesAsync();
        await _hubContext.SendToUser(userId, "UpdateUnreadCount", new { count = 0 });
    }

    public async Task<NotificationSettingsResponse> GetSettingsAsync(Guid userId)
    {
        var settings = await _context.NotificationSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
            return new NotificationSettingsResponse
            {
                FollowUpReminderEnabled = true,
                DealClosingEnabled = true,
                InactiveAlertEnabled = true
            };

        return new NotificationSettingsResponse
        {
            FollowUpReminderEnabled = settings.FollowUpReminderEnabled,
            DealClosingEnabled = settings.DealClosingEnabled,
            InactiveAlertEnabled = settings.InactiveAlertEnabled
        };
    }

    public async Task<NotificationSettingsResponse> UpdateSettingsAsync(Guid userId, NotificationSettingsRequest request)
    {
        var settings = await _context.NotificationSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new NotificationSettings { UserId = userId };
            _context.NotificationSettings.Add(settings);
        }

        settings.FollowUpReminderEnabled = request.FollowUpReminderEnabled;
        settings.DealClosingEnabled = request.DealClosingEnabled;
        settings.InactiveAlertEnabled = request.InactiveAlertEnabled;

        await _context.SaveChangesAsync();
        return await GetSettingsAsync(userId);
    }

    public async Task CreateNotificationAsync(Guid userId, NotificationType type, string title, string message, Guid? referenceId, string? referenceType, NotificationPriority priority)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            Priority = priority
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Push via SignalR (if configured)
        var response = new NotificationResponse
        {
            Id = notification.Id,
            Type = notification.Type.ToString(),
            Title = notification.Title,
            Message = notification.Message,
            ReferenceId = notification.ReferenceId,
            ReferenceType = notification.ReferenceType,
            IsRead = false,
            Priority = notification.Priority.ToString(),
            CreatedAt = notification.CreatedAt
        };

        await _hubContext.SendToUser(userId, "ReceiveNotification", response);

        // Update unread count
        var unreadCount = await GetUnreadCountAsync(userId);
        await _hubContext.SendToUser(userId, "UpdateUnreadCount", unreadCount);
    }

    public async Task<bool> ShouldCreateNotificationAsync(Guid userId, NotificationType type)
    {
        var today = DateTime.UtcNow.Date;
        return !await _context.NotificationDedups
            .AnyAsync(d => d.UserId == userId && d.Type == type && d.Date == today);
    }

    public async Task CreateDedupEntryAsync(Guid userId, NotificationType type)
    {
        var dedup = new NotificationDedup
        {
            UserId = userId,
            Type = type,
            Date = DateTime.UtcNow.Date
        };
        _context.NotificationDedups.Add(dedup);
        await _context.SaveChangesAsync();
    }

    public async Task EnsureSettingsExistAsync(Guid userId)
    {
        if (!await _context.NotificationSettings.AnyAsync(s => s.UserId == userId))
        {
            _context.NotificationSettings.Add(new NotificationSettings { UserId = userId });
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> TryCreateNotificationAsync(Guid userId, NotificationType type, string title, string message, Guid? referenceId, string? referenceType, NotificationPriority priority)
    {
        var today = DateTime.UtcNow.Date;

        // Check if dedup entry already exists
        var exists = await _context.NotificationDedups
            .AnyAsync(d => d.UserId == userId && d.Type == type && d.Date == today);

        if (exists) return false;

        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            Priority = priority
        };

        _context.Notifications.Add(notification);

        var dedup = new NotificationDedup
        {
            UserId = userId,
            Type = type,
            Date = today
        };
        _context.NotificationDedups.Add(dedup);

        // Save both in single transaction
        await _context.SaveChangesAsync();

        // Push via SignalR (fire-and-forget, don't fail the notification creation if SignalR is down)
        try
        {
            var response = new NotificationResponse
            {
                Id = notification.Id,
                Type = notification.Type.ToString(),
                Title = notification.Title,
                Message = notification.Message,
                ReferenceId = notification.ReferenceId,
                ReferenceType = notification.ReferenceType,
                IsRead = false,
                Priority = notification.Priority.ToString(),
                CreatedAt = notification.CreatedAt
            };

            await _hubContext.SendToUser(userId, "ReceiveNotification", response);
            var unreadCount = await GetUnreadCountAsync(userId);
            await _hubContext.SendToUser(userId, "UpdateUnreadCount", unreadCount);
        }
        catch (Exception)
        {
            // SignalR failure shouldn't rollback notification creation
        }

        return true;
    }
}