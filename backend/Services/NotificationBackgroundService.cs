using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationBackgroundService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(15);

    public NotificationBackgroundService(IServiceProvider serviceProvider, ILogger<NotificationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Initial delay to let app start
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunAllNotificationsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running notification background job");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task RunAllNotificationsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        await RunFollowUpRemindersAsync(context, notificationService);
        await RunDealClosingAlertsAsync(context, notificationService);
        await RunInactiveSalesAlertsAsync(context, notificationService);
    }

    private async Task RunFollowUpRemindersAsync(AppDbContext context, INotificationService notificationService)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-3);

        var doctorsWithRecentActivity = context.Activities
            .Where(a => a.CreatedAt >= cutoffDate)
            .Select(a => a.DoctorId)
            .Distinct()
            .ToHashSet();

        var staleDeals = await context.Deals
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST)
            .Where(d => !doctorsWithRecentActivity.Contains(d.DoctorId))
            .ToListAsync();

        if (staleDeals.Count == 0) return;

        // Batch load all sales settings upfront
        var salesIds = staleDeals.Select(d => d.SalesId).Distinct().ToList();
        var settingsMap = (await context.NotificationSettings
            .Where(s => salesIds.Contains(s.UserId))
            .ToListAsync())
            .ToDictionary(s => s.UserId);

        // Ensure settings exist for sales without them (batch)
        var missingIds = salesIds.Where(id => !settingsMap.ContainsKey(id)).ToList();
        if (missingIds.Count > 0)
        {
            foreach (var id in missingIds)
                settingsMap[id] = new NotificationSettings { UserId = id };
            context.NotificationSettings.AddRange(missingIds.Select(id => new NotificationSettings { UserId = id }));
            await context.SaveChangesAsync();
            // Reload to get proper instances
            settingsMap = (await context.NotificationSettings
                .Where(s => salesIds.Contains(s.UserId))
                .ToListAsync())
                .ToDictionary(s => s.UserId);
        }

        // Collect all userIds that need notification processing
        var notificationsToSend = new List<(Guid UserId, NotificationType Type, string Title, string Message, Guid? RefId, string RefType, NotificationPriority Priority)>();

        foreach (var deal in staleDeals)
        {
            var isEnabled = settingsMap.TryGetValue(deal.SalesId, out var settings)
                ? settings?.FollowUpReminderEnabled ?? true
                : true;

            if (isEnabled)
            {
                notificationsToSend.Add((
                    deal.SalesId,
                    NotificationType.FollowUpReminder,
                    "Follow-up Reminder",
                    $"Deal '{deal.Notes}' has no activity for 3 days. Follow up with {deal.Doctor?.Name ?? "the doctor"}.",
                    deal.Id, "Deal",
                    NotificationPriority.High));
            }
        }

        // Batch process notifications
        foreach (var notification in notificationsToSend)
        {
            await notificationService.TryCreateNotificationAsync(
                notification.UserId, notification.Type, notification.Title,
                notification.Message, notification.RefId, notification.RefType, notification.Priority);
        }
    }

    private async Task RunDealClosingAlertsAsync(AppDbContext context, INotificationService notificationService)
    {
        var futureDate = DateTime.UtcNow.AddDays(7);
        var imminentDate = DateTime.UtcNow.AddDays(2);

        var closingDeals = await context.Deals
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .ThenInclude(s => s!.Manager)
            .Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST)
            .Where(d => d.ExpectedCloseDate != default && d.ExpectedCloseDate <= futureDate && d.ExpectedCloseDate >= DateTime.UtcNow)
            .ToListAsync();

        if (closingDeals.Count == 0) return;

        // Collect all unique userIds (sales + managers)
        var allUserIds = closingDeals
            .SelectMany(d => {
                var ids = new List<Guid> { d.SalesId };
                if (d.Sales?.ManagerId != null) ids.Add(d.Sales.ManagerId.Value);
                return ids;
            })
            .Distinct()
            .ToList();

        // Batch load all settings
        var settingsMap = (await context.NotificationSettings
            .Where(s => allUserIds.Contains(s.UserId))
            .ToListAsync())
            .ToDictionary(s => s.UserId);

        var notificationsToSend = new List<(Guid UserId, NotificationType Type, string Title, string Message, Guid? RefId, string RefType, NotificationPriority Priority)>();

        foreach (var deal in closingDeals)
        {
            var priority = deal.ExpectedCloseDate <= imminentDate
                ? NotificationPriority.Urgent
                : NotificationPriority.Normal;

            // Alert sales member
            notificationsToSend.Add((
                deal.SalesId,
                NotificationType.DealClosing,
                "Deal Closing Soon",
                $"Deal '{deal.Notes}' is expected to close on {deal.ExpectedCloseDate:yyyy-MM-dd}. Stage: {deal.Stage}.",
                deal.Id, "Deal", priority));

            // Also alert their manager
            if (deal.Sales?.ManagerId != null)
            {
                notificationsToSend.Add((
                    deal.Sales.ManagerId.Value,
                    NotificationType.DealClosing,
                    "Deal Closing Soon",
                    $"Team deal '{deal.Notes}' closes on {deal.ExpectedCloseDate:yyyy-MM-dd}.",
                    deal.Id, "Deal", priority));
            }
        }

        // Batch process
        foreach (var notification in notificationsToSend)
        {
            await notificationService.TryCreateNotificationAsync(
                notification.UserId, notification.Type, notification.Title,
                notification.Message, notification.RefId, notification.RefType, notification.Priority);
        }
    }

    private async Task RunInactiveSalesAlertsAsync(AppDbContext context, INotificationService notificationService)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-5);

        var usersWithRecentActivity = context.Activities
            .Where(a => a.CreatedAt >= cutoffDate)
            .Select(a => a.SalesId)
            .Distinct()
            .ToHashSet();

        var inactiveSales = await context.Users
            .Where(u => u.Role == UserRole.SalesMember)
            .Where(u => !usersWithRecentActivity.Contains(u.Id))
            .ToListAsync();

        if (inactiveSales.Count == 0) return;

        // Get admin user as fallback for sales with no manager
        var adminUser = await context.Users
            .Where(u => u.Role == UserRole.Admin)
            .FirstOrDefaultAsync();

        // Batch load last activities for all inactive sales
        var lastActivities = await context.Activities
            .Where(a => inactiveSales.Select(s => s.Id).Contains(a.SalesId))
            .GroupBy(a => a.SalesId)
            .Select(g => new { SalesId = g.Key, LastActivity = g.Max(a => a.CreatedAt) })
            .ToListAsync();
        var lastActivityMap = lastActivities.ToDictionary(x => x.SalesId, x => x.LastActivity);

        // Collect notification targets
        var notificationsToSend = new List<(Guid UserId, NotificationType Type, string Title, string Message, Guid? RefId, string RefType, NotificationPriority Priority)>();

        foreach (var sales in inactiveSales)
        {
            var lastActivity = lastActivityMap.TryGetValue(sales.Id, out var la) ? la : default;
            var daysInactive = lastActivity != default
                ? (int)(DateTime.UtcNow - lastActivity).TotalDays
                : (int)(DateTime.UtcNow - sales.CreatedAt).TotalDays;

            var message = $"{sales.FullName} has been inactive for {daysInactive} days. Last activity: {(lastActivity != default ? lastActivity.ToString("yyyy-MM-dd") : "never")}.";
            var notifyUserId = sales.ManagerId ?? adminUser?.Id ?? Guid.Empty;

            if (notifyUserId == Guid.Empty)
            {
                _logger.LogWarning("Cannot send inactive alert for {SalesName}: no manager and no admin found", sales.FullName);
                continue;
            }

            notificationsToSend.Add((
                notifyUserId,
                NotificationType.InactiveAlert,
                "Inactive Sales Alert",
                message,
                sales.Id, "User",
                NotificationPriority.Urgent));
        }

        // Batch load settings for all notification targets
        var targetIds = notificationsToSend.Select(n => n.UserId).Distinct().ToList();
        var settingsMap = (await context.NotificationSettings
            .Where(s => targetIds.Contains(s.UserId))
            .ToListAsync())
            .ToDictionary(s => s.UserId);

        // Batch process only enabled notifications
        foreach (var notification in notificationsToSend)
        {
            var isEnabled = settingsMap.TryGetValue(notification.UserId, out var settings)
                ? settings?.InactiveAlertEnabled ?? true
                : true;

            if (isEnabled)
            {
                await notificationService.TryCreateNotificationAsync(
                    notification.UserId, notification.Type, notification.Title,
                    notification.Message, notification.RefId, notification.RefType, notification.Priority);
            }
        }
    }

    private async Task EnsureSettingsAndNotify(
        AppDbContext context,
        INotificationService notificationService,
        Guid userId,
        NotificationType type,
        string title,
        string message,
        Guid? referenceId,
        string referenceType,
        NotificationPriority priority)
    {
        // This method is now only used for single notification scenarios
        // For batch operations, use TryCreateNotificationAsync directly after checking settings
        if (userId == Guid.Empty) return;

        var settings = await context.NotificationSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        var isEnabled = type switch
        {
            NotificationType.FollowUpReminder => settings?.FollowUpReminderEnabled ?? true,
            NotificationType.DealClosing => settings?.DealClosingEnabled ?? true,
            NotificationType.InactiveAlert => settings?.InactiveAlertEnabled ?? true,
            _ => true
        };

        if (!isEnabled) return;

        await notificationService.TryCreateNotificationAsync(userId, type, title, message, referenceId, referenceType, priority);
    }
}