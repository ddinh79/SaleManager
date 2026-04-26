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
        var cutoffDate = DateTime.UtcNow.AddDays(-3); // 3 days inactive

        // Get doctors with recent activity (Activity links to Doctor, not Deal)
        var doctorsWithRecentActivity = context.Activities
            .Where(a => a.CreatedAt >= cutoffDate)
            .Select(a => a.DoctorId)
            .Distinct()
            .ToHashSet();

        var staleDeals = context.Deals
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST)
            .Where(d => !doctorsWithRecentActivity.Contains(d.DoctorId))
            .ToList();

        foreach (var deal in staleDeals)
        {
            await EnsureSettingsAndNotify(context, notificationService, deal.SalesId,
                NotificationType.FollowUpReminder,
                "Follow-up Reminder",
                $"Deal '{deal.Notes}' has no activity for 3 days. Follow up with {deal.Doctor?.Name ?? "the doctor"}.",
                deal.Id, "Deal",
                NotificationPriority.High);
        }
    }

    private async Task RunDealClosingAlertsAsync(AppDbContext context, INotificationService notificationService)
    {
        var futureDate = DateTime.UtcNow.AddDays(7);
        var imminentDate = DateTime.UtcNow.AddDays(2);

        var closingDeals = context.Deals
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .ThenInclude(s => s!.Manager)
            .Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST)
            .Where(d => d.ExpectedCloseDate != default && d.ExpectedCloseDate <= futureDate && d.ExpectedCloseDate >= DateTime.UtcNow)
            .ToList();

        foreach (var deal in closingDeals)
        {
            var priority = deal.ExpectedCloseDate <= imminentDate
                ? NotificationPriority.Urgent
                : NotificationPriority.Normal;

            // Alert sales member
            var salesMessage = $"Deal '{deal.Notes}' is expected to close on {deal.ExpectedCloseDate:yyyy-MM-dd}. Stage: {deal.Stage}.";
            await EnsureSettingsAndNotify(context, notificationService, deal.SalesId,
                NotificationType.DealClosing,
                "Deal Closing Soon",
                salesMessage,
                deal.Id, "Deal",
                priority);

            // Also alert their manager
            if (deal.Sales?.ManagerId != null)
            {
                var managerMessage = $"Team deal '{deal.Notes}' closes on {deal.ExpectedCloseDate:yyyy-MM-dd}.";
                await EnsureSettingsAndNotify(context, notificationService, deal.Sales.ManagerId.Value,
                    NotificationType.DealClosing,
                    "Deal Closing Soon",
                    managerMessage,
                    deal.Id, "Deal",
                    priority);
            }
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

        var inactiveSales = context.Users
            .Where(u => u.Role == UserRole.SalesMember)
            .Where(u => !usersWithRecentActivity.Contains(u.Id))
            .ToList();

        foreach (var sales in inactiveSales)
        {
            var lastActivity = await context.Activities
                .Where(a => a.SalesId == sales.Id)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => a.CreatedAt)
                .FirstOrDefaultAsync();

            var daysInactive = lastActivity != default
                ? (int)(DateTime.UtcNow - lastActivity).TotalDays
                : 5;

            var message = $"{sales.FullName} has been inactive for {daysInactive} days. Last activity: {(lastActivity != default ? lastActivity.ToString("yyyy-MM-dd") : "never")}.";

            await EnsureSettingsAndNotify(context, notificationService, sales.ManagerId ?? Guid.Empty,
                NotificationType.InactiveAlert,
                "Inactive Sales Alert",
                message,
                sales.Id, "User",
                NotificationPriority.Urgent);
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
        if (userId == Guid.Empty) return;

        // Ensure user has settings row
        await notificationService.EnsureSettingsExistAsync(userId);

        var settings = await context.NotificationSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        var isEnabled = type switch
        {
            NotificationType.FollowUpReminder => settings?.FollowUpReminderEnabled ?? true,
            NotificationType.DealClosing => settings?.DealClosingEnabled ?? true,
            NotificationType.InactiveAlert => settings?.InactiveAlertEnabled ?? true,
            _ => true
        };

        if (!isEnabled) return;

        // Dedup check
        if (!await notificationService.ShouldCreateNotificationAsync(userId, type)) return;

        // Create notification
        await notificationService.CreateNotificationAsync(userId, type, title, message, referenceId, referenceType, priority);

        // Record dedup
        await notificationService.CreateDedupEntryAsync(userId, type);
    }
}