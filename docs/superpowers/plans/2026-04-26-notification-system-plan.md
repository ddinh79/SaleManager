# Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time notification system for the Sales CRM with SignalR push, background job scheduling, deduplication, and a full notification UI.

**Architecture:** SignalR for real-time push to connected clients + REST API for notification management + IHostedService background job running every 15 minutes to generate notifications and push them via SignalR.

**Tech Stack:** .NET 8 (ASP.NET Core, EF Core, SignalR), React 18 + TypeScript + @microsoft/signalr client, Zustand

---

## Files to Create

### Backend
```
backend/Entities/Notification.cs         (extend existing)
backend/Entities/NotificationDedup.cs    (new)
backend/Entities/NotificationSettings.cs (new)
backend/Entities/Enums.cs                (add NotificationPriority)
backend/DTOs/NotificationDtos.cs         (new)
backend/Services/INotificationService.cs (new)
backend/Services/NotificationService.cs (new)
backend/Services/NotificationBackgroundService.cs (new - IHostedService)
backend/Hubs/NotificationHub.cs          (new)
backend/Controllers/NotificationsController.cs (new)
backend/Data/AppDbContext.cs             (modify - add new DbSets)
backend/Program.cs                        (modify - register services)
```

### Frontend
```
frontend/src/services/notificationService.ts   (new)
frontend/src/store/notificationStore.ts         (new - Zustand)
frontend/src/hooks/useNotificationSignalR.ts    (new)
frontend/src/components/NotificationBell.tsx     (new)
frontend/src/components/NotificationDropdown.tsx (new)
frontend/src/pages/Notifications.tsx            (new)
frontend/src/pages/NotificationSettings.tsx     (new)
frontend/src/App.tsx                            (modify - add routes)
frontend/src/navigation/menuConfig.tsx         (modify - add menu item)
frontend/src/components/TopBarNew.tsx           (modify - integrate bell)
```

---

## Task 1: Extend Backend Entities

**Files:**
- Modify: `backend/Entities/Notification.cs`
- Modify: `backend/Entities/Enums.cs`
- Create: `backend/Entities/NotificationDedup.cs`
- Create: `backend/Entities/NotificationSettings.cs`

- [ ] **Step 1: Add NotificationPriority enum to Enums.cs**

```csharp
public enum NotificationPriority
{
    Low = 0,
    Normal = 1,
    High = 2,
    Urgent = 3
}
```

- [ ] **Step 2: Extend Notification.cs**

Replace current file content:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Entities;

public class Notification
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    public Guid? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }  // "Deal", "Doctor", "User"

    public bool IsRead { get; set; } = false;

    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 3: Create NotificationDedup.cs**

```csharp
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace SalesSystem.Entities;

[Index(nameof(UserId), nameof(Type), nameof(Date), IsUnique = true)]
public class NotificationDedup
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public NotificationType Type { get; set; }

    public DateTime Date { get; set; }  // date-only (UTC), stripped of time
}
```

- [ ] **Step 4: Create NotificationSettings.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class NotificationSettings
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public bool FollowUpReminderEnabled { get; set; } = true;
    public bool DealClosingEnabled { get; set; } = true;
    public bool InactiveAlertEnabled { get; set; } = true;
}
```

- [ ] **Step 5: Commit**

```bash
git add backend/Entities/Notification.cs backend/Entities/Enums.cs backend/Entities/NotificationDedup.cs backend/Entities/NotificationSettings.cs
git commit -m "feat(notifications): add NotificationPriority enum, extend Notification entity, add NotificationDedup and NotificationSettings entities"
```

---

## Task 2: Add Notification DbSets to AppDbContext

**Files:**
- Modify: `backend/Data/AppDbContext.cs`

- [ ] **Step 1: Read current AppDbContext.cs**

Read `backend/Data/AppDbContext.cs` to understand existing DbSet pattern.

- [ ] **Step 2: Add new DbSets after existing ones**

```csharp
public DbSet<Notification> Notifications { get; set; } = null!;
public DbSet<NotificationDedup> NotificationDedups { get; set; } = null!;
public DbSet<NotificationSettings> NotificationSettings { get; set; } = null!;
```

- [ ] **Step 3: Configure new relationships in OnModelCreating**

```csharp
// Notification → User (many-to-one)
modelBuilder.Entity<Notification>()
    .HasOne(n => n.User)
    .WithMany()
    .HasForeignKey(n => n.UserId)
    .OnDelete(DeleteBehavior.Cascade);

// NotificationSettings → User (one-to-one)
modelBuilder.Entity<NotificationSettings>()
    .HasOne(ns => ns.User)
    .WithMany()
    .HasForeignKey(ns => ns.UserId)
    .OnDelete(DeleteBehavior.Cascade);

// NotificationDedup → composite unique index (configured via attribute)
```

- [ ] **Step 4: Build to verify**

```bash
cd backend; dotnet build
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add backend/Data/AppDbContext.cs
git commit -m "feat(notifications): add Notification, NotificationDedup, NotificationSettings DbSets"
```

---

## Task 3: Create Notification DTOs

**Files:**
- Create: `backend/DTOs/NotificationDtos.cs`

- [ ] **Step 1: Create DTOs file**

```csharp
namespace SalesSystem.DTOs;

// === Request DTOs ===

public class NotificationSettingsRequest
{
    public bool FollowUpReminderEnabled { get; set; }
    public bool DealClosingEnabled { get; set; }
    public bool InactiveAlertEnabled { get; set; }
}

// === Response DTOs ===

public class NotificationResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public bool IsRead { get; set; }
    public string Priority { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class NotificationListResponse
{
    public List<NotificationResponse> Items { get; set; } = new();
    public int Total { get; set; }
    public int UnreadCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class UnreadCountResponse
{
    public int Count { get; set; }
}

public class NotificationSettingsResponse
{
    public bool FollowUpReminderEnabled { get; set; }
    public bool DealClosingEnabled { get; set; }
    public bool InactiveAlertEnabled { get; set; }
}
```

- [ ] **Step 2: Build to verify**

```bash
cd backend; dotnet build
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/DTOs/NotificationDtos.cs
git commit -m "feat(notifications): add NotificationDtos (request/response DTOs)"
```

---

## Task 4: Create NotificationSignalR Hub

**Files:**
- Create: `backend/Hubs/NotificationHub.cs`
- Modify: `backend/Program.cs`

- [ ] **Step 1: Create NotificationHub.cs**

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Hubs;

public class NotificationHub : Hub
{
    public async Task JoinUserGroup()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }
}
```

- [ ] **Step 2: Register SignalR in Program.cs**

Read `backend/Program.cs` and add SignalR after CORS configuration:

```csharp
// SignalR
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationHubContext, NotificationHubContext>();
```

Add hub endpoint:

```csharp
// After app.UseRouting()
app.MapHub<NotificationHub>("/hubs/notifications");
```

- [ ] **Step 3: Create NotificationHubContext helper**

Create `backend/Services/NotificationHubContext.cs`:

```csharp
using Microsoft.AspNetCore.SignalR;
using SalesSystem.Hubs;

namespace SalesSystem.Services;

public interface INotificationHubContext
{
    Task SendToUser(Guid userId, string method, object argument);
}

public class NotificationHubContext : INotificationHubContext
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationHubContext(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUser(Guid userId, string method, object argument)
    {
        await _hubContext.Clients.Group($"User_{userId}").SendAsync(method, argument);
    }
}
```

- [ ] **Step 4: Build to verify**

```bash
cd backend; dotnet build
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add backend/Hubs/NotificationHub.cs backend/Services/NotificationHubContext.cs backend/Program.cs
git commit -m "feat(notifications): add NotificationHub (SignalR)"
```

---

## Task 5: Create Notification Service

**Files:**
- Create: `backend/Services/INotificationService.cs`
- Create: `backend/Services/NotificationService.cs`

- [ ] **Step 1: Create INotificationService.cs**

```csharp
using SalesSystem.DTOs;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public interface INotificationService
{
    Task<NotificationListResponse> GetNotificationsAsync(Guid userId, int page, int pageSize, bool unreadOnly);
    Task<UnreadCountResponse> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<NotificationSettingsResponse> GetSettingsAsync(Guid userId);
    Task<NotificationSettingsResponse> UpdateSettingsAsync(Guid userId, NotificationSettingsRequest request);
    Task CreateNotificationAsync(Guid userId, NotificationType type, string title, string message, Guid? referenceId, string? referenceType, NotificationPriority priority);
    Task<bool> ShouldCreateNotificationAsync(Guid userId, NotificationType type);
    Task CreateDedupEntryAsync(Guid userId, NotificationType type);
    Task EnsureSettingsExistAsync(Guid userId);
}
```

- [ ] **Step 2: Create NotificationService.cs**

```csharp
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

        // Push via SignalR
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
}
```

- [ ] **Step 3: Build to verify**

```bash
cd backend; dotnet build
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Services/INotificationService.cs backend/Services/NotificationService.cs
git commit -m "feat(notifications): add INotificationService and NotificationService"
```

---

## Task 6: Create Notifications Controller

**Files:**
- Create: `backend/Controllers/NotificationsController.cs`
- Modify: `backend/Program.cs`

- [ ] **Step 1: Create NotificationsController.cs**

```csharp
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
```

- [ ] **Step 2: Register NotificationService in Program.cs**

Read Program.cs and add:

```csharp
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSingleton<INotificationHubContext, NotificationHubContext>();
```

Also ensure all users have notification settings on startup — add to seed section or create a middleware. For now, we'll ensure settings exist when the service is called.

- [ ] **Step 3: Build to verify**

```bash
cd backend; dotnet build
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Controllers/NotificationsController.cs backend/Program.cs
git commit -m "feat(notifications): add NotificationsController with REST API"
```

---

## Task 7: Create Notification Background Service

**Files:**
- Create: `backend/Services/NotificationBackgroundService.cs`

- [ ] **Step 1: Create NotificationBackgroundService.cs**

```csharp
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

        // Get deals with no recent activity
        var dealsWithRecentActivity = context.Activities
            .Where(a => a.CreatedAt >= cutoffDate)
            .Select(a => a.DealId)
            .Distinct()
            .ToHashSet();

        var staleDeals = context.Deals
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST)
            .Where(d => !dealsWithRecentActivity.Contains(d.Id))
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
```

- [ ] **Step 2: Register in Program.cs**

```csharp
builder.Services.AddHostedService<NotificationBackgroundService>();
```

- [ ] **Step 3: Build to verify**

```bash
cd backend; dotnet build
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Services/NotificationBackgroundService.cs backend/Program.cs
git commit -m "feat(notifications): add NotificationBackgroundService (IHostedService, 15min interval)"
```

---

## Backend Summary

After Tasks 1-7:
- Entities extended ✓
- DbContext updated ✓
- DTOs created ✓
- SignalR hub + context helper ✓
- NotificationService with full CRUD ✓
- REST Controller ✓
- Background service (IHostedService) ✓
- DI registrations ✓

---

## Task 8: Create Frontend Notification Service & Store

**Files:**
- Create: `frontend/src/services/notificationService.ts`
- Create: `frontend/src/store/notificationStore.ts`

- [ ] **Step 1: Create notificationService.ts**

Read `frontend/src/services/api.ts` first to understand axios setup.

```typescript
import api from './api';

const notificationService = {
  getNotifications: async (page = 1, pageSize = 20, unreadOnly = false) => {
    const response = await api.get('/notifications', {
      params: { page, pageSize, unreadOnly }
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await api.post('/notifications/read-all');
  },

  getSettings: async () => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  updateSettings: async (data: {
    followUpReminderEnabled: boolean;
    dealClosingEnabled: boolean;
    inactiveAlertEnabled: boolean;
  }) => {
    const response = await api.post('/notifications/settings', data);
    return response.data;
  },
};

export default notificationService;
```

- [ ] **Step 2: Create notificationStore.ts** (Zustand store)

Read `frontend/src/store/authStore.ts` to understand the pattern.

```typescript
import { create } from 'zustand';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  setUnreadCount: (count) => set({ unreadCount: count }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  setNotifications: (notifications) => set({ notifications }),
}));
```

- [ ] **Step 3: TypeScript check**

```bash
cd frontend; npx tsc --noEmit
```

Expected: 0 errors (if .ts files, not .tsx — some errors in other files are pre-existing)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/notificationService.ts frontend/src/store/notificationStore.ts
git commit -m "feat(notifications): add notificationService.ts and notificationStore.ts"
```

---

## Task 9: Create SignalR Hook

**Files:**
- Create: `frontend/src/hooks/useNotificationSignalR.ts`
- Install: `@microsoft/signalr`

- [ ] **Step 1: Install SignalR client**

```bash
cd frontend; npm install @microsoft/signalr
```

- [ ] **Step 2: Create useNotificationSignalR.ts**

Read `frontend/src/store/authStore.ts` to get the JWT token pattern.

```typescript
import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import notificationService from '../services/notificationService';

const HUB_URL = 'http://localhost:5001/hubs/notifications';

export const useNotificationSignalR = () => {
  const { addNotification, setUnreadCount } = useNotificationStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', (notification: any) => {
      addNotification(notification);
    });

    connection.on('UpdateUnreadCount', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    connection.onreconnecting(() => {
      console.log('Notification SignalR reconnecting...');
    });

    connection.onreconnected(() => {
      console.log('Notification SignalR reconnected');
    });

    connection.start()
      .then(() => {
        connection.invoke('JoinUserGroup').catch(console.error);
        // Fetch initial unread count
        notificationService.getUnreadCount().then((res) => {
          setUnreadCount(res.count);
        });
      })
      .catch(console.error);

    return () => {
      connection.invoke('LeaveUserGroup').catch(console.error);
      connection.stop().catch(console.error);
    };
  }, [user?.id, addNotification, setUnreadCount]);
};
```

- [ ] **Step 3: TypeScript check**

```bash
cd frontend; npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useNotificationSignalR.ts
git add frontend/package.json frontend/package-lock.json
git commit -m "feat(notifications): add SignalR hook for real-time notifications"
```

---

## Task 10: Create NotificationBell & NotificationDropdown Components

**Files:**
- Create: `frontend/src/components/NotificationBell.tsx`
- Create: `frontend/src/components/NotificationDropdown.tsx`

- [ ] **Step 1: Create NotificationBell.tsx**

```typescript
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import NotificationDropdown from './NotificationDropdown';
import { useState, useRef, useEffect } from 'react';

const NotificationBell = () => {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <NotificationDropdown onClose={() => setShowDropdown(false)} />
      )}
    </div>
  );
};

export default NotificationBell;
```

- [ ] **Step 2: Create NotificationDropdown.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

interface Props {
  onClose: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Normal: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-600',
};

const NotificationDropdown: React.FC<Props> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    notificationService.getNotifications(1, 5, false).then((res) => {
      setNotifications(res.items);
      setLoading(false);
    });
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      markAsRead(notification.id);
    }

    // Navigate based on referenceType
    if (notification.referenceType === 'Deal' && notification.referenceId) {
      navigate(`/deals/${notification.referenceId}`);
    } else if (notification.referenceType === 'Doctor' && notification.referenceId) {
      navigate(`/doctors/${notification.referenceId}`);
    } else if (notification.referenceType === 'User' && notification.referenceId) {
      navigate(`/users/${notification.referenceId}`);
    }

    onClose();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Notifications</h3>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-indigo-600 hover:text-indigo-700"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                !notification.isRead ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.Normal}`}>
                  {notification.priority.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{notification.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatTime(notification.createdAt)}</p>
                </div>
                {!notification.isRead && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        onClick={() => { navigate('/notifications'); onClose(); }}
        className="px-4 py-3 text-center text-sm text-indigo-600 hover:bg-slate-50 cursor-pointer border-t border-slate-100"
      >
        View all notifications
      </div>
    </div>
  );
};

export default NotificationDropdown;
```

- [ ] **Step 3: TypeScript check**

```bash
cd frontend; npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/NotificationBell.tsx frontend/src/components/NotificationDropdown.tsx
git commit -m "feat(notifications): add NotificationBell and NotificationDropdown components"
```

---

## Task 11: Update TopBarNew with NotificationBell

**Files:**
- Modify: `frontend/src/components/TopBarNew.tsx`

- [ ] **Step 1: Read current TopBarNew.tsx**

Read `frontend/src/components/TopBarNew.tsx` (already done earlier)

- [ ] **Step 2: Replace Bell button with NotificationBell component**

Remove the hardcoded bell button:

```tsx
// Remove this:
// <button className="p-2 text-slate-500 hover:text-slate-700 ... relative">
//   <Bell className="w-5 h-5" />
//   <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
// </button>

// Replace with:
import NotificationBell from './NotificationBell';

// ... and replace the bell button with:
<NotificationBell />
```

- [ ] **Step 3: Add SignalR hook to TopBarNew**

TopBarNew is rendered inside MainLayout. The hook needs to be active on any page that uses TopBarNew. Add to the component:

```tsx
import { useNotificationSignalR } from '../hooks/useNotificationSignalR';

// Inside component:
useNotificationSignalR();
```

- [ ] **Step 4: TypeScript check**

```bash
cd frontend; npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/TopBarNew.tsx
git commit -m "feat(notifications): integrate NotificationBell into TopBarNew with SignalR"
```

---

## Task 12: Create Full Notifications Page

**Files:**
- Create: `frontend/src/pages/Notifications.tsx`

- [ ] **Step 1: Create Notifications.tsx**

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Normal: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-600',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const pageSize = 20;
  const navigate = useNavigate();
  const { markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, [page, filter]);

  const loadNotifications = async () => {
    setLoading(true);
    const res = await notificationService.getNotifications(page, pageSize, filter === 'unread');
    setNotifications(res.items);
    setTotal(res.total);
    setLoading(false);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }

    if (notification.referenceType === 'Deal' && notification.referenceId) {
      navigate(`/deals/${notification.referenceId}`);
    } else if (notification.referenceType === 'Doctor' && notification.referenceId) {
      navigate(`/doctors/${notification.referenceId}`);
    } else if (notification.referenceType === 'User' && notification.referenceId) {
      navigate(`/users/${notification.referenceId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No notifications</div>
        ) : (
          <>
            {notifications.map((notification, idx) => (
              <div
                key={notification.id}
                onClick={() => handleMarkAsRead(notification)}
                className={`px-4 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                  idx === notifications.length - 1 ? '' : ''
                } ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <span className={`mt-0.5 px-2 py-1 rounded text-xs font-semibold ${PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.Normal}`}>
                    {notification.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400 capitalize">{notification.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm bg-slate-100 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * pageSize >= total}
            className="px-3 py-1.5 text-sm bg-slate-100 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
```

- [ ] **Step 2: TypeScript check**

```bash
cd frontend; npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Notifications.tsx
git commit -m "feat(notifications): add NotificationsPage with list, filter, pagination"
```

---

## Task 13: Create NotificationSettings Page

**Files:**
- Create: `frontend/src/pages/NotificationSettings.tsx`

- [ ] **Step 1: Create NotificationSettings.tsx**

```typescript
import { useEffect, useState } from 'react';
import notificationService from '../services/notificationService';

interface Settings {
  followUpReminderEnabled: boolean;
  dealClosingEnabled: boolean;
  inactiveAlertEnabled: boolean;
}

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState<Settings>({
    followUpReminderEnabled: true,
    dealClosingEnabled: true,
    inactiveAlertEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    notificationService.getSettings().then((res) => {
      setSettings(res);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSaved(false);
    setSaving(true);
    try {
      await notificationService.updateSettings(newSettings);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
        <p className="text-sm text-slate-500 mb-6">
          Control which notifications you receive. Changes are saved automatically.
        </p>

        <div className="space-y-4">
          {/* Follow-up Reminder */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-800">Follow-up Reminders</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Get notified when your deals have no activity for 3 days
              </p>
            </div>
            <button
              onClick={() => handleToggle('followUpReminderEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.followUpReminderEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.followUpReminderEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Deal Closing */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-800">Deal Closing Alerts</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Get notified when deals are expected to close soon
              </p>
            </div>
            <button
              onClick={() => handleToggle('dealClosingEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.dealClosingEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.dealClosingEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Inactive Alert */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-800">Inactive Sales Alerts</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Get notified when team members are inactive for 5+ days (Managers only)
              </p>
            </div>
            <button
              onClick={() => handleToggle('inactiveAlertEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.inactiveAlertEnabled ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.inactiveAlertEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {saved && (
          <p className="text-sm text-green-600 mt-4">Settings saved successfully</p>
        )}
        {saving && (
          <p className="text-sm text-slate-400 mt-4">Saving...</p>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
```

- [ ] **Step 2: TypeScript check**

```bash
cd frontend; npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/NotificationSettings.tsx
git commit -m "feat(notifications): add NotificationSettingsPage with toggle switches"
```

---

## Task 14: Add Routes & Menu Items

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/navigation/menuConfig.tsx`

- [ ] **Step 1: Read App.tsx**

Read `frontend/src/App.tsx` to understand route patterns.

- [ ] **Step 2: Add routes**

Add imports:
```typescript
import NotificationsPage from './pages/Notifications';
import NotificationSettingsPage from './pages/NotificationSettings';
```

Add routes in the `<Routes>` section:
```typescript
<Route path="/notifications" element={<NotificationsPage />} />
<Route path="/notifications/settings" element={<NotificationSettingsPage />} />
```

- [ ] **Step 3: Update menuConfig.tsx**

Read `frontend/src/navigation/menuConfig.tsx` (or .ts — check which exists).

Add to the navigation menu:
```typescript
{
  label: 'Notifications',
  path: '/notifications',
  icon: <Bell className="w-5 h-5" />,
  roles: ['Admin', 'SalesManager', 'SalesMember']
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd frontend; npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/navigation/menuConfig.tsx
git commit -m "feat(notifications): add notification routes and menu items"
```

---

## Task 15: Final Build Verification

- [ ] **Step 1: Build backend**

```bash
cd backend; dotnet build
```

Expected: 0 errors

- [ ] **Step 2: TypeScript frontend**

```bash
cd frontend; npx tsc --noEmit
```

Expected: 0 errors (some pre-existing errors in other files are OK as long as notification files are clean)

- [ ] **Step 3: Commit final**

```bash
git add -A; git commit -m "feat(notifications): complete notification system - SignalR push, background jobs, bell UI"
```

---

## Spec Coverage Check

| Spec Section | Tasks |
|---|---|
| DB: Notification extend | Task 1 |
| DB: NotificationDedup | Task 1 |
| DB: NotificationSettings | Task 1 |
| DB: NotificationPriority enum | Task 1 |
| Background: IHostedService + 15min timer | Task 7 |
| Background: 3 rules (FollowUp, DealClosing, Inactive) | Task 7 |
| Background: Dedup logic | Task 7 |
| Background: Backfill on startup | Task 7 |
| API: GET /notifications | Task 6 |
| API: POST /{id}/read | Task 6 |
| API: POST /read-all | Task 6 |
| API: GET/POST /settings | Task 6 |
| SignalR Hub | Task 4 |
| Frontend: Bell badge | Task 10 |
| Frontend: Dropdown | Task 10 |
| Frontend: Full page | Task 12 |
| Frontend: Settings page | Task 13 |
| Click-to-navigate | Tasks 10, 12 |
| Startup backfill | Task 7 |

---

## Open Questions Answered

1. **Scheduling:** IHostedService + Timer (every 15 min) ✓
2. **Settings storage:** Extend NotificationSettings entity (per-user row) ✓
3. **Delivery:** SignalR real-time push ✓
4. **Spam prevention:** Daily cap per type per user (1 per day) ✓
5. **Startup backfill:** Run missed notifications sweep for last 7 days ✓