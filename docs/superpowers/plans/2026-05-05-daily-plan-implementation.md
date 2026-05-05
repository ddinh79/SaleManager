# Auto Daily Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Auto Daily Plan system with hybrid time-block scheduling, adaptive capacity, activity-linked completion, anti-gaming, and manager visibility.

**Architecture:** DailyPlanService aggregates tasks from TaskService, calculates capacity, categorizes into MUST_DO/SHOULD_DO/NICE_TO_HAVE, assigns time slots, and matches activities for auto-completion. ActivityMatcher handles auto-complete logic. AntiGamingMonitor flags suspicious users. DailyPlanHub broadcasts real-time updates.

**Tech Stack:** .NET 8, Entity Framework Core, SignalR, React 18, TypeScript, TailwindCSS

---

## File Structure

### Backend - New Entity Files
| File | Purpose |
|------|---------|
| `backend/Entities/DailyPlan.cs` | DailyPlan entity |
| `backend/Entities/DailyPlanTask.cs` | DailyPlanTask entity |
| `backend/Entities/UserPlanSettings.cs` | UserPlanSettings entity |
| `backend/Entities/UserPlanMetrics.cs` | UserPlanMetrics entity |

### Backend - New DTO Files
| File | Purpose |
|------|---------|
| `backend/DTOs/DailyPlanDtos.cs` | Request/Response DTOs |

### Backend - New Service Files
| File | Purpose |
|------|---------|
| `backend/Services/IDailyPlanService.cs` | IDailyPlanService interface |
| `backend/Services/DailyPlanService.cs` | Main service |
| `backend/Services/CapacityCalculator.cs` | Capacity calculation |
| `backend/Services/ActivityMatcher.cs` | Auto-complete matching |
| `backend/Services/AntiGamingMonitor.cs` | Anti-gaming logic |

### Backend - Hub
| File | Purpose |
|------|---------|
| `backend/Hubs/DailyPlanHub.cs` | SignalR hub |

### Backend - Controller
| File | Purpose |
|------|---------|
| `backend/Controllers/DailyPlanController.cs` | API endpoints |

### Backend - Modified Files
| File | Changes |
|------|---------|
| `backend/Program.cs` | Register services, map hub |
| `backend/Data/AppDbContext.cs` | Add DbSets, configure entities |

### Frontend - New Files
| File | Purpose |
|------|---------|
| `frontend/src/types/index.ts` | Add DailyPlan types |
| `frontend/src/services/dailyPlanService.ts` | API calls |
| `frontend/src/hooks/useDailyPlan.ts` | State hook |
| `frontend/src/pages/DailyPlan.tsx` | Main page |
| `frontend/src/components/daily-plan/TaskCard.tsx` | Task card component |

### Frontend - Modified Files
| File | Changes |
|------|---------|
| `frontend/src/App.tsx` | Add route |

---

## Implementation Tasks

### Task 1: Create DailyPlan Entities

**Files:**
- Create: `backend/Entities/DailyPlan.cs`
- Create: `backend/Entities/DailyPlanTask.cs`
- Create: `backend/Entities/UserPlanSettings.cs`
- Create: `backend/Entities/UserPlanMetrics.cs`

- [ ] **Step 1: Create DailyPlan.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class DailyPlan
{
    [Key]
    public Guid Id { get; set; }

    public Guid SalesId { get; set; }
    public User Sales { get; set; } = null!;

    public DateTime Date { get; set; }
    public DateTime GeneratedAt { get; set; }

    public int MustDoLimit { get; set; }
    public int ShouldDoLimit { get; set; }
    public DateTime StartTime { get; set; }

    public PlanStatus Status { get; set; } = PlanStatus.NOT_STARTED;
    public Guid? ActiveTaskId { get; set; }

    public decimal CompletionRate { get; set; }
    public decimal ConfidenceScore { get; set; }
    public bool IsRecoveryMode { get; set; }

    public ICollection<DailyPlanTask> Tasks { get; set; } = new List<DailyPlanTask>();
}

public enum PlanStatus
{
    ON_TRACK,
    OFF_TRACK,
    COMPLETED,
    NOT_STARTED
}
```

- [ ] **Step 2: Create DailyPlanTask.cs**

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Entities;

public class DailyPlanTask
{
    [Key]
    public Guid Id { get; set; }

    public Guid DailyPlanId { get; set; }
    public DailyPlan DailyPlan { get; set; } = null!;

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public Guid? DealId { get; set; }
    public Deal? Deal { get; set; }

    // Timing
    public DateTime PlannedStart { get; set; }
    public DateTime? ActualStart { get; set; }
    public int DelayMinutes { get; set; }
    public int PlannedDurationMinutes { get; set; }

    // Classification
    public string Category { get; set; } = ""; // MUST_DO, SHOULD_DO, NICE_TO_HAVE
    public int Score { get; set; }

    // State
    public PlanTaskStatus Status { get; set; } = PlanTaskStatus.PENDING;
    public Guid? CompletedActivityId { get; set; }
    public bool IsLowConfidence { get; set; }

    public string ManualReasonCode { get; set; } = "";
    public string ManualReasonNote { get; set; } = "";

    // Display info
    public string DoctorName { get; set; } = "";
    public string HospitalName { get; set; } = "";
    public string TaskType { get; set; } = "";
    public decimal? DealValue { get; set; }
    public string Temperature { get; set; } = "";
}

public enum PlanTaskStatus
{
    PENDING,
    IN_PROGRESS,
    COMPLETED_AUTO,
    COMPLETED_MANUAL,
    SKIPPED,
    EXPIRED,
    OFF_TRACK
}
```

- [ ] **Step 3: Create UserPlanSettings.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class UserPlanSettings
{
    [Key]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public decimal? CapacityMultiplierOverride { get; set; } // 0.8 → 1.2
    public DateTime? PreferredStartTime { get; set; }

    // System-calculated (read-only for user)
    public int CalculatedMustDoLimit { get; set; }
    public int CalculatedShouldDoLimit { get; set; }
    public decimal AvgTasksPerDay { get; set; }
}
```

- [ ] **Step 4: Create UserPlanMetrics.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class UserPlanMetrics
{
    [Key]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Rolling 7-day
    public int TasksCompleted7d { get; set; }
    public int TasksCompletedManually7d { get; set; }
    public int TasksSkipped7d { get; set; }
    public decimal CompletionRate7d { get; set; }

    // Yesterday
    public decimal CompletionRateYesterday { get; set; }
    public bool IsRecoveryMode { get; set; }

    // Anti-gaming
    public bool IsSuspicious { get; set; }
    public string SuspiciousReason { get; set; } = "";
    public DateTime? FlaggedAt { get; set; }
    public int SuspiciousActivityCount { get; set; }
}
```

- [ ] **Step 5: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 2: Create DailyPlanDtos.cs

**Files:**
- Create: `backend/DTOs/DailyPlanDtos.cs`

- [ ] **Step 1: Create DTOs**

```csharp
namespace SalesSystem.DTOs;

public class DailyPlanResponse
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Status { get; set; } = "";
    public Guid? ActiveTaskId { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal ConfidenceScore { get; set; }
    public bool IsRecoveryMode { get; set; }
    public CapacityInfo Capacity { get; set; } = new();
    public List<DailyPlanTaskDto> MustDo { get; set; } = new();
    public List<DailyPlanTaskDto> ShouldDo { get; set; } = new();
    public List<DailyPlanTaskDto> NiceToHave { get; set; } = new();
}

public class DailyPlanTaskDto
{
    public Guid Id { get; set; }
    public DateTime PlannedStart { get; set; }
    public DateTime? ActualStart { get; set; }
    public int DelayMinutes { get; set; }
    public int PlannedDurationMinutes { get; set; }
    public string Category { get; set; } = "";
    public int Score { get; set; }
    public string Status { get; set; } = "";
    public bool IsLowConfidence { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = "";
    public string HospitalName { get; set; } = "";
    public string TaskType { get; set; } = "";
    public decimal? DealValue { get; set; }
    public string Temperature { get; set; } = "";
}

public class CapacityInfo
{
    public int MustDoLimit { get; set; }
    public int ShouldDoLimit { get; set; }
    public DateTime StartTime { get; set; }
    public string Mode { get; set; } = "NORMAL"; // NORMAL, RECOVERY, STRETCH
}

public class ManualCompleteRequest
{
    public string ReasonCode { get; set; } = "";
    public string Note { get; set; } = "";
}

public class SkipTaskRequest
{
    public string ReasonCode { get; set; } = "";
    public string Note { get; set; } = "";
}

public class CapacityUpdateRequest
{
    public decimal? CapacityMultiplierOverride { get; set; }
    public DateTime? PreferredStartTime { get; set; }
}

public class TeamDailyPlanResponse
{
    public DateTime Date { get; set; }
    public List<TeamMemberPlanDto> TeamPlans { get; set; } = new();
    public TeamSummaryDto Summary { get; set; } = new();
}

public class TeamMemberPlanDto
{
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = "";
    public string PlanStatus { get; set; } = "";
    public ActiveTaskDto ActiveTask { get; set; } = new();
    public int Completed { get; set; }
    public int MustDo { get; set; }
    public int OverdueCount { get; set; }
    public DateTime? LastActivityAt { get; set; }
}

public class ActiveTaskDto
{
    public string Task { get; set; } = "";
    public DateTime? StartedAt { get; set; }
}

public class TeamSummaryDto
{
    public int TeamOnTrack { get; set; }
    public int TeamOffTrack { get; set; }
    public int TeamNotStarted { get; set; }
    public int TotalCompleted { get; set; }
    public int TotalMustDo { get; set; }
}
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 3: Create CapacityCalculator.cs

**Files:**
- Create: `backend/Services/CapacityCalculator.cs`

- [ ] **Step 1: Create CapacityCalculator.cs**

```csharp
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class CapacityCalculator
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepo;

    // Guardrails
    private const int MIN_MUST_DO = 3;
    private const int MAX_MUST_DO = 8;
    private const int MIN_SHOULD_DO = 5;
    private const int MAX_SHOULD_DO = 15;
    private const int MAX_TOTAL = 20;
    private const decimal MIN_OVERRIDE = 0.8m;
    private const decimal MAX_OVERRIDE = 1.2m;

    public CapacityCalculator(AppDbContext context, IUserRepository userRepo)
    {
        _context = context;
        _userRepo = userRepo;
    }

    public async Task<UserPlanSettings> GetOrCreateSettingsAsync(Guid userId)
    {
        var settings = await _context.UserPlanSettings.FindAsync(userId);
        if (settings == null)
        {
            settings = new UserPlanSettings { UserId = userId };
            _context.UserPlanSettings.Add(settings);
            await _context.SaveChangesAsync();
        }
        return settings;
    }

    public async Task<UserPlanMetrics> GetOrCreateMetricsAsync(Guid userId)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(userId);
        if (metrics == null)
        {
            metrics = new UserPlanMetrics { UserId = userId };
            _context.UserPlanMetrics.Add(metrics);
            await _context.SaveChangesAsync();
        }
        return metrics;
    }

    public async Task<CapacityInfo> CalculateCapacityAsync(Guid userId)
    {
        var settings = await GetOrCreateSettingsAsync(userId);
        var metrics = await GetOrCreateMetricsAsync(userId);

        // Calculate base from 7-day average
        var baseCapacity = CalculateBaseCapacity(metrics.AvgTasksPerDay);

        // Apply override if set
        var mustDo = baseCapacity.MustDo;
        var shouldDo = baseCapacity.ShouldDo;

        if (settings.CapacityMultiplierOverride.HasValue)
        {
            var multiplier = Math.Clamp(settings.CapacityMultiplierOverride.Value, MIN_OVERRIDE, MAX_OVERRIDE);
            mustDo = (int)Math.Round(mustDo * multiplier);
            shouldDo = (int)Math.Round(shouldDo * multiplier);
        }

        // Apply recovery/stretch mode adjustment
        var mode = "NORMAL";
        if (metrics.IsRecoveryMode)
        {
            mustDo = (int)Math.Round(mustDo * 0.7);
            shouldDo = (int)Math.Round(shouldDo * 0.7);
            mode = "RECOVERY";
        }
        else if (metrics.CompletionRate7d > 0.9m)
        {
            mustDo = (int)Math.Round(mustDo * 1.1);
            shouldDo = (int)Math.Round(shouldDo * 1.1);
            mode = "STRETCH";
        }

        // Apply guardrails
        mustDo = Math.Clamp(mustDo, MIN_MUST_DO, MAX_MUST_DO);
        shouldDo = Math.Clamp(shouldDo, MIN_SHOULD_DO, MAX_SHOULD_DO);
        shouldDo = Math.Min(shouldDo, MAX_TOTAL - mustDo);

        return new CapacityInfo
        {
            MustDoLimit = mustDo,
            ShouldDoLimit = shouldDo,
            StartTime = settings.PreferredStartTime ?? new DateTime(2001, 1, 1, 9, 0, 0),
            Mode = mode
        };
    }

    private BaseCapacity CalculateBaseCapacity(decimal avgTasksPerDay)
    {
        var mustDo = (int)Math.Round(avgTasksPerDay * 0.4m);
        var shouldDo = (int)Math.Round(avgTasksPerDay * 0.8m);

        return new BaseCapacity
        {
            MustDo = Math.Clamp(mustDo, MIN_MUST_DO, MAX_MUST_DO),
            ShouldDo = Math.Clamp(shouldDo, MIN_SHOULD_DO, MAX_SHOULD_DO)
        };
    }

    private class BaseCapacity
    {
        public int MustDo { get; set; }
        public int ShouldDo { get; set; }
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 4: Create ActivityMatcher.cs

**Files:**
- Create: `backend/Services/ActivityMatcher.cs`

- [ ] **Step 1: Create ActivityMatcher.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class ActivityMatcher
{
    private readonly AppDbContext _context;
    private readonly IActivityRepository _activityRepo;

    // Matching window: ±2 hours
    private const int MATCH_WINDOW_HOURS = 2;

    // Activity type mapping
    private static readonly Dictionary<string, List<ActivityType>> TaskTypeMapping = new()
    {
        { "CALL", new List<ActivityType> { ActivityType.CALL } },
        { "FOLLOW_UP", new List<ActivityType> { ActivityType.CALL, ActivityType.MESSAGE } },
        { "MEETING", new List<ActivityType> { ActivityType.MEETING } },
        { "DEMO", new List<ActivityType> { ActivityType.DEMO } },
        { "SAMPLE", new List<ActivityType> { ActivityType.SAMPLE_SENT } },
    };

    public ActivityMatcher(AppDbContext context, IActivityRepository activityRepo)
    {
        _context = context;
        _activityRepo = activityRepo;
    }

    public async Task<ActivityMatchResult?> FindMatchingActivityAsync(DailyPlanTask task)
    {
        if (!TaskTypeMapping.TryGetValue(task.TaskType, out var validTypes))
            return null;

        var windowStart = task.PlannedStart.AddHours(-MATCH_WINDOW_HOURS);
        var windowEnd = task.PlannedStart.AddHours(MATCH_WINDOW_HOURS);

        // Find activities within window
        var activities = await _context.Activities
            .Where(a => a.SalesId == task.DailyPlan.SalesId)
            .Where(a => a.DoctorId == task.DoctorId)
            .Where(a => validTypes.Contains(a.Type))
            .Where(a => a.CreatedAt >= windowStart && a.CreatedAt <= windowEnd)
            .OrderBy(a => Math.Abs((a.CreatedAt - task.PlannedStart).TotalMinutes))
            .FirstOrDefaultAsync();

        if (activities == null)
            return null;

        // Anti-fake checks
        var isValid = ValidateActivity(activities);
        if (!isValid.IsValid)
            return new ActivityMatchResult { Activity = activities, IsLowConfidence = true };

        return new ActivityMatchResult { Activity = activities, IsLowConfidence = false };
    }

    private ActivityValidationResult ValidateActivity(Activity activity)
    {
        // Duration check for CALL activities
        if (activity.Type == ActivityType.CALL && activity.DurationSeconds < 10)
            return new ActivityValidationResult { IsValid = false, Reason = "duration_too_short" };

        // GPS mismatch check for MEETING/DEMO
        if ((activity.Type == ActivityType.MEETING || activity.Type == ActivityType.DEMO)
            && !string.IsNullOrEmpty(activity.GpsResult)
            && activity.GpsResult != "OK")
            return new ActivityValidationResult { IsValid = true, IsSuspicious = true };

        return new ActivityValidationResult { IsValid = true };
    }

    public async Task UpdateMetricsAfterCompletionAsync(Guid userId, bool isAuto, bool isManual)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(userId);
        if (metrics == null) return;

        if (isAuto)
            metrics.TasksCompleted7d++;
        else if (isManual)
            metrics.TasksCompletedManually7d++;

        // Recalculate 7-day average
        metrics.AvgTasksPerDay = metrics.TasksCompleted7d / 7.0m;
        metrics.CompletionRate7d = CalculateCompletionRate(metrics);

        await _context.SaveChangesAsync();
    }

    private decimal CalculateCompletionRate(UserPlanMetrics metrics)
    {
        var totalQuality = metrics.TasksCompleted7d * 1.0m + metrics.TasksCompletedManually7d * 0.5m + metrics.TasksSkipped7d * 0.2m;
        var totalPossible = metrics.TasksCompleted7d + metrics.TasksCompletedManually7d + metrics.TasksSkipped7d;
        return totalPossible > 0 ? totalQuality / totalPossible : 0m;
    }
}

public class ActivityMatchResult
{
    public Activity Activity { get; set; } = null!;
    public bool IsLowConfidence { get; set; }
}

public class ActivityValidationResult
{
    public bool IsValid { get; set; }
    public bool IsSuspicious { get; set; }
    public string Reason { get; set; } = "";
}
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 5: Create AntiGamingMonitor.cs

**Files:**
- Create: `backend/Services/AntiGamingMonitor.cs`

- [ ] **Step 1: Create AntiGamingMonitor.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public class AntiGamingMonitor
{
    private readonly AppDbContext _context;

    private const decimal SUSPICIOUS_ACTIVITY_RATE_THRESHOLD = 0.3m;
    private const decimal MANUAL_COMPLETION_RATIO_THRESHOLD = 0.5m;
    private const decimal SKIP_RATE_THRESHOLD = 0.3m;

    public AntiGamingMonitor(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UserPlanMetrics> CheckAndFlagAsync(Guid userId)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(userId);
        if (metrics == null)
            return CreateDefaultMetrics(userId);

        // Check suspicious activity rate
        var totalActivities = await _context.Activities
            .Where(a => a.SalesId == userId)
            .Where(a => a.CreatedAt >= DateTime.UtcNow.AddDays(-7))
            .CountAsync();

        var suspiciousRate = totalActivities > 0
            ? (decimal)metrics.SuspiciousActivityCount / totalActivities
            : 0m;

        if (suspiciousRate > SUSPICIOUS_ACTIVITY_RATE_THRESHOLD)
        {
            FlagUser(metrics, "suspicious_activity", "Suspicious activity rate exceeds 30%");
            return metrics;
        }

        // Check manual completion ratio
        var totalCompleted = metrics.TasksCompleted7d + metrics.TasksCompletedManually7d;
        if (totalCompleted > 0)
        {
            var manualRatio = (decimal)metrics.TasksCompletedManually7d / totalCompleted;
            if (manualRatio > MANUAL_COMPLETION_RATIO_THRESHOLD)
            {
                // Reduce manual weight impact
                metrics.SuspiciousReason = "manual_ratio_high";
            }
        }

        // Check skip rate
        var totalTasks = metrics.TasksCompleted7d + metrics.TasksCompletedManually7d + metrics.TasksSkipped7d;
        if (totalTasks > 0)
        {
            var skipRate = (decimal)metrics.TasksSkipped7d / totalTasks;
            if (skipRate > SKIP_RATE_THRESHOLD)
            {
                FlagUser(metrics, "skip_rate_high", "Skip rate exceeds 30%");
            }
        }

        await _context.SaveChangesAsync();
        return metrics;
    }

    public async Task RecordSuspiciousActivityAsync(Guid salesId)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(salesId);
        if (metrics == null) return;

        metrics.SuspiciousActivityCount++;
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ShouldExcludeFromCapacityAsync(Guid userId)
    {
        var metrics = await _context.UserPlanMetrics.FindAsync(userId);
        return metrics?.IsSuspicious ?? false;
    }

    private void FlagUser(UserPlanMetrics metrics, string reason, string description)
    {
        metrics.IsSuspicious = true;
        metrics.SuspiciousReason = reason;
        metrics.FlaggedAt = DateTime.UtcNow;
    }

    private UserPlanMetrics CreateDefaultMetrics(Guid userId)
    {
        var metrics = new UserPlanMetrics
        {
            UserId = userId,
            AvgTasksPerDay = 5, // Default
            CompletionRate7d = 0,
            IsRecoveryMode = false
        };
        _context.UserPlanMetrics.Add(metrics);
        return metrics;
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 6: Create IDailyPlanService.cs and DailyPlanService.cs

**Files:**
- Create: `backend/Services/IDailyPlanService.cs`
- Create: `backend/Services/DailyPlanService.cs`

- [ ] **Step 1: Create IDailyPlanService.cs**

```csharp
using SalesSystem.DTOs;

namespace SalesSystem.Services;

public interface IDailyPlanService
{
    Task<DailyPlanResponse> GetDailyPlanAsync(Guid userId, DateTime date);
    Task<DailyPlanTaskDto> CompleteTaskAsync(Guid userId, Guid taskId, ManualCompleteRequest request);
    Task<DailyPlanTaskDto> SkipTaskAsync(Guid userId, Guid taskId, SkipTaskRequest request);
    Task<DailyPlanTaskDto> ActivateTaskAsync(Guid userId, Guid taskId);
    Task<CapacityInfo> GetCapacityAsync(Guid userId);
    Task<CapacityInfo> UpdateCapacityAsync(Guid userId, CapacityUpdateRequest request);
    Task<TeamDailyPlanResponse> GetTeamPlansAsync(Guid managerId, DateTime date);
}
```

- [ ] **Step 2: Create DailyPlanService.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class DailyPlanService : IDailyPlanService
{
    private readonly AppDbContext _context;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IDealRepository _dealRepo;
    private readonly IUserRepository _userRepo;
    private readonly CapacityCalculator _capacityCalculator;
    private readonly ActivityMatcher _activityMatcher;
    private readonly AntiGamingMonitor _antiGamingMonitor;

    public DailyPlanService(
        AppDbContext context,
        IDoctorRepository doctorRepo,
        IDealRepository dealRepo,
        IUserRepository userRepo,
        CapacityCalculator capacityCalculator,
        ActivityMatcher activityMatcher,
        AntiGamingMonitor antiGamingMonitor)
    {
        _context = context;
        _doctorRepo = doctorRepo;
        _dealRepo = dealRepo;
        _userRepo = userRepo;
        _capacityCalculator = capacityCalculator;
        _activityMatcher = activityMatcher;
        _antiGamingMonitor = antiGamingMonitor;
    }

    public async Task<DailyPlanResponse> GetDailyPlanAsync(Guid userId, DateTime date)
    {
        // Check for existing plan
        var existingPlan = await _context.DailyPlans
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.SalesId == userId && p.Date.Date == date.Date);

        if (existingPlan != null)
            return MapToResponse(existingPlan);

        // Generate new plan
        return await GeneratePlanAsync(userId, date);
    }

    private async Task<DailyPlanResponse> GeneratePlanAsync(Guid userId, DateTime date)
    {
        var capacity = await _capacityCalculator.CalculateCapacityAsync(userId);
        var doctors = await _doctorRepo.GetByAssignedSalesIdAsync(userId);
        var deals = await _dealRepo.GetBySalesIdAsync(userId, 1000, 0);
        var now = DateTime.UtcNow;

        var tasks = new List<DailyPlanTask>();
        var taskDtos = new List<DailyPlanTaskDto>();

        // Aggregate tasks from Doctor.NextFollowUpAt
        foreach (var doctor in doctors)
        {
            if (doctor.NextFollowUpAt.HasValue && doctor.NextFollowUpAt.Value <= now.AddDays(1))
            {
                var overdueDays = (int)(now - doctor.NextFollowUpAt.Value).TotalDays;
                tasks.Add(new DailyPlanTask
                {
                    Id = Guid.NewGuid(),
                    DoctorId = doctor.Id,
                    DoctorName = doctor.Name,
                    HospitalName = doctor.Hospital?.Name ?? "",
                    TaskType = "FOLLOW_UP",
                    Score = overdueDays > 0 ? 100 : 85,
                    Temperature = doctor.Temperature.ToString(),
                    Category = overdueDays > 0 ? "MUST_DO" : "SHOULD_DO"
                });
            }
        }

        // Aggregate tasks from Deals
        foreach (var deal in deals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST))
        {
            var overdueDays = (int)(now - deal.ExpectedCloseDate).TotalDays;
            var closeWithin3Days = deal.ExpectedCloseDate <= now.AddDays(3);

            if (overdueDays > 0 || closeWithin3Days)
            {
                var score = overdueDays > 0 ? 100 : (deal.Stage == DealStage.NEGOTIATION ? 95 : 85);
                tasks.Add(new DailyPlanTask
                {
                    Id = Guid.NewGuid(),
                    DoctorId = deal.DoctorId,
                    DealId = deal.Id,
                    DoctorName = deal.Doctor?.Name ?? "",
                    HospitalName = deal.Doctor?.Hospital?.Name ?? "",
                    TaskType = deal.Stage == DealStage.NEGOTIATION ? "MEETING" : "CALL",
                    DealValue = deal.TotalValue,
                    Score = score,
                    Temperature = deal.Doctor?.Temperature.ToString() ?? "WARM",
                    Category = overdueDays > 0 ? "MUST_DO" : "SHOULD_DO"
                });
            }
        }

        // Sort by score DESC
        tasks = tasks.OrderByDescending(t => t.Score).ToList();

        // Categorize and assign time slots
        var mustDoTasks = tasks.Take(capacity.MustDoLimit).ToList();
        var shouldDoTasks = tasks.Skip(capacity.MustDoLimit).Take(capacity.ShouldDoLimit).ToList();
        var niceToHaveTasks = tasks.Skip(capacity.MustDoLimit + capacity.ShouldDoLimit).ToList();

        // Assign time slots to MUST_DO
        var currentTime = date.Date.Add(capacity.StartTime.TimeOfDay);
        foreach (var task in mustDoTasks)
        {
            task.PlannedStart = currentTime;
            task.PlannedDurationMinutes = GetDurationForTaskType(task.TaskType);
            currentTime = currentTime.AddMinutes(task.PlannedDurationMinutes + 5);
        }

        // Create plan entity
        var plan = new DailyPlan
        {
            Id = Guid.NewGuid(),
            SalesId = userId,
            Date = date.Date,
            GeneratedAt = DateTime.UtcNow,
            MustDoLimit = capacity.MustDoLimit,
            ShouldDoLimit = capacity.ShouldDoLimit,
            StartTime = capacity.StartTime,
            Status = PlanStatus.NOT_STARTED,
            Tasks = mustDoTasks.Concat(shouldDoTasks).Concat(niceToHaveTasks).ToList()
        };

        foreach (var task in plan.Tasks)
            task.DailyPlanId = plan.Id;

        _context.DailyPlans.Add(plan);
        await _context.SaveChangesAsync();

        return MapToResponse(plan);
    }

    private int GetDurationForTaskType(string taskType) => taskType switch
    {
        "CALL" => 15,
        "FOLLOW_UP" => 10,
        "MEETING" => 45,
        "DEMO" => 45,
        "SAMPLE" => 30,
        _ => 15
    };

    private DailyPlanResponse MapToResponse(DailyPlan plan)
    {
        return new DailyPlanResponse
        {
            Id = plan.Id,
            Date = plan.Date,
            Status = plan.Status.ToString(),
            ActiveTaskId = plan.ActiveTaskId,
            CompletionRate = plan.CompletionRate,
            ConfidenceScore = plan.ConfidenceScore,
            IsRecoveryMode = plan.IsRecoveryMode,
            Capacity = new CapacityInfo
            {
                MustDoLimit = plan.MustDoLimit,
                ShouldDoLimit = plan.ShouldDoLimit,
                StartTime = plan.StartTime,
                Mode = plan.IsRecoveryMode ? "RECOVERY" : "NORMAL"
            },
            MustDo = plan.Tasks.Where(t => t.Category == "MUST_DO").Select(MapToDto).ToList(),
            ShouldDo = plan.Tasks.Where(t => t.Category == "SHOULD_DO").Select(MapToDto).ToList(),
            NiceToHave = plan.Tasks.Where(t => t.Category == "NICE_TO_HAVE").Select(MapToDto).ToList()
        };
    }

    private DailyPlanTaskDto MapToDto(DailyPlanTask task)
    {
        return new DailyPlanTaskDto
        {
            Id = task.Id,
            PlannedStart = task.PlannedStart,
            ActualStart = task.ActualStart,
            DelayMinutes = task.DelayMinutes,
            PlannedDurationMinutes = task.PlannedDurationMinutes,
            Category = task.Category,
            Score = task.Score,
            Status = task.Status.ToString(),
            IsLowConfidence = task.IsLowConfidence,
            DoctorId = task.DoctorId,
            DoctorName = task.DoctorName,
            HospitalName = task.HospitalName,
            TaskType = task.TaskType,
            DealValue = task.DealValue,
            Temperature = task.Temperature
        };
    }

    // Implementation stubs for remaining methods
    public async Task<DailyPlanTaskDto> CompleteTaskAsync(Guid userId, Guid taskId, ManualCompleteRequest request)
    {
        var task = await _context.DailyPlanTasks.FindAsync(taskId);
        if (task == null || task.DailyPlan.SalesId != userId)
            throw new InvalidOperationException("Task not found");

        task.Status = PlanTaskStatus.COMPLETED_MANUAL;
        task.IsLowConfidence = true;
        task.ManualReasonCode = request.ReasonCode;
        task.ManualReasonNote = request.Note;

        await _activityMatcher.UpdateMetricsAfterCompletionAsync(userId, false, true);
        await _context.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<DailyPlanTaskDto> SkipTaskAsync(Guid userId, Guid taskId, SkipTaskRequest request)
    {
        var task = await _context.DailyPlanTasks.FindAsync(taskId);
        if (task == null || task.DailyPlan.SalesId != userId)
            throw new InvalidOperationException("Task not found");

        task.Status = PlanTaskStatus.SKIPPED;
        task.ManualReasonCode = request.ReasonCode;
        task.ManualReasonNote = request.Note;

        await _context.SaveChangesAsync();
        return MapToDto(task);
    }

    public async Task<DailyPlanTaskDto> ActivateTaskAsync(Guid userId, Guid taskId)
    {
        var plan = await _context.DailyPlans
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.SalesId == userId && p.Date.Date == DateTime.UtcNow.Date);

        if (plan == null)
            throw new InvalidOperationException("Plan not found");

        var task = plan.Tasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null)
            throw new InvalidOperationException("Task not found");

        plan.ActiveTaskId = taskId;
        task.Status = PlanTaskStatus.IN_PROGRESS;

        await _context.SaveChangesAsync();
        return MapToDto(task);
    }

    public async Task<CapacityInfo> GetCapacityAsync(Guid userId)
    {
        return await _capacityCalculator.CalculateCapacityAsync(userId);
    }

    public async Task<CapacityInfo> UpdateCapacityAsync(Guid userId, CapacityUpdateRequest request)
    {
        var settings = await _capacityCalculator.GetOrCreateSettingsAsync(userId);
        settings.CapacityMultiplierOverride = request.CapacityMultiplierOverride;
        settings.PreferredStartTime = request.PreferredStartTime;
        await _context.SaveChangesAsync();
        return await _capacityCalculator.CalculateCapacityAsync(userId);
    }

    public async Task<TeamDailyPlanResponse> GetTeamPlansAsync(Guid managerId, DateTime date)
    {
        var teamSales = await _userRepo.FindAsync(u => u.ManagerId == managerId);
        var teamPlans = new List<TeamMemberPlanDto>();

        foreach (var sales in teamSales)
        {
            var plan = await GetDailyPlanAsync(sales.Id, date);
            var activeTask = plan.MustDo.Concat(plan.ShouldDo).FirstOrDefault(t => t.Id == plan.ActiveTaskId);

            teamPlans.Add(new TeamMemberPlanDto
            {
                SalesId = sales.Id,
                SalesName = sales.FullName,
                PlanStatus = plan.Status,
                ActiveTask = activeTask != null ? new ActiveTaskDto { Task = $"Call {activeTask.DoctorName}", StartedAt = activeTask.ActualStart } : null,
                Completed = plan.MustDo.Count(t => t.Status == "COMPLETED_AUTO" || t.Status == "COMPLETED_MANUAL"),
                MustDo = plan.MustDo.Count,
                OverdueCount = plan.MustDo.Count(t => t.DelayMinutes > 0),
                LastActivityAt = DateTime.UtcNow
            });
        }

        return new TeamDailyPlanResponse
        {
            Date = date,
            TeamPlans = teamPlans,
            Summary = new TeamSummaryDto
            {
                TeamOnTrack = teamPlans.Count(p => p.PlanStatus == "ON_TRACK"),
                TeamOffTrack = teamPlans.Count(p => p.PlanStatus == "OFF_TRACK"),
                TeamNotStarted = teamPlans.Count(p => p.PlanStatus == "NOT_STARTED"),
                TotalCompleted = teamPlans.Sum(p => p.Completed),
                TotalMustDo = teamPlans.Sum(p => p.MustDo)
            }
        };
    }
}
```

- [ ] **Step 3: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 7: Create DailyPlanHub.cs

**Files:**
- Create: `backend/Hubs/DailyPlanHub.cs`

- [ ] **Step 1: Create DailyPlanHub.cs**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Hubs;

[Authorize]
public class DailyPlanHub : Hub
{
    public async Task JoinUserGroup(Guid userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"DailyPlan_User_{userId}");
    }

    public async Task LeaveUserGroup(Guid userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"DailyPlan_User_{userId}");
    }

    public async Task JoinTeamGroup(Guid managerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"DailyPlan_Team_{managerId}");
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
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 8: Create DailyPlanController.cs

**Files:**
- Create: `backend/Controllers/DailyPlanController.cs`

- [ ] **Step 1: Create DailyPlanController.cs**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs;
using SalesSystem.Helpers;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/daily-plan")]
public class DailyPlanController : ControllerBase
{
    private readonly IDailyPlanService _dailyPlanService;

    public DailyPlanController(IDailyPlanService dailyPlanService)
    {
        _dailyPlanService = dailyPlanService;
    }

    [HttpGet]
    public async Task<ActionResult<DailyPlanResponse>> GetTodayPlan()
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.GetDailyPlanAsync(userId.Value, DateTime.UtcNow.Date);
        return Ok(result);
    }

    [HttpGet("{date}")]
    public async Task<ActionResult<DailyPlanResponse>> GetPlanForDate(DateTime date)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.GetDailyPlanAsync(userId.Value, date);
        return Ok(result);
    }

    [HttpPost("{taskId}/complete")]
    public async Task<ActionResult<DailyPlanTaskDto>> CompleteTask(Guid taskId, [FromBody] ManualCompleteRequest request)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.CompleteTaskAsync(userId.Value, taskId, request);
        return Ok(result);
    }

    [HttpPost("{taskId}/skip")]
    public async Task<ActionResult<DailyPlanTaskDto>> SkipTask(Guid taskId, [FromBody] SkipTaskRequest request)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.SkipTaskAsync(userId.Value, taskId, request);
        return Ok(result);
    }

    [HttpPost("{taskId}/activate")]
    public async Task<ActionResult<DailyPlanTaskDto>> ActivateTask(Guid taskId)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.ActivateTaskAsync(userId.Value, taskId);
        return Ok(result);
    }

    [HttpGet("capacity")]
    public async Task<ActionResult<CapacityInfo>> GetCapacity()
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.GetCapacityAsync(userId.Value);
        return Ok(result);
    }

    [HttpPut("capacity")]
    public async Task<ActionResult<CapacityInfo>> UpdateCapacity([FromBody] CapacityUpdateRequest request)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.UpdateCapacityAsync(userId.Value, request);
        return Ok(result);
    }

    [HttpGet("team")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult<TeamDailyPlanResponse>> GetTeamPlans([FromQuery] DateTime? date)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.GetTeamPlansAsync(userId.Value, date ?? DateTime.UtcNow.Date);
        return Ok(result);
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 9: Update AppDbContext.cs and Program.cs

**Files:**
- Modify: `backend/Data/AppDbContext.cs`
- Modify: `backend/Program.cs`

- [ ] **Step 1: Update AppDbContext.cs**

Find the DbSet section and add:
```csharp
public DbSet<DailyPlan> DailyPlans => Set<DailyPlan>();
public DbSet<DailyPlanTask> DailyPlanTasks => Set<DailyPlanTask>();
public DbSet<UserPlanSettings> UserPlanSettings => Set<UserPlanSettings>();
public DbSet<UserPlanMetrics> UserPlanMetrics => Set<UserPlanMetrics>();
```

Find OnModelCreating and add entity configuration:
```csharp
// DailyPlan -> DailyPlanTask
modelBuilder.Entity<DailyPlan>()
    .HasMany(p => p.Tasks)
    .WithOne(t => t.DailyPlan)
    .HasForeignKey(t => t.DailyPlanId)
    .OnDelete(DeleteBehavior.Cascade);

// DailyPlan -> User
modelBuilder.Entity<DailyPlan>()
    .HasOne(p => p.Sales)
    .WithMany()
    .HasForeignKey(p => p.SalesId)
    .OnDelete(DeleteBehavior.Restrict);

// UserPlanSettings -> User (one-to-one)
modelBuilder.Entity<UserPlanSettings>()
    .HasOne(s => s.User)
    .WithOne()
    .HasForeignKey<UserPlanSettings>(s => s.UserId)
    .OnDelete(DeleteBehavior.Cascade);

// UserPlanMetrics -> User (one-to-one)
modelBuilder.Entity<UserPlanMetrics>()
    .HasOne(m => m.User)
    .WithOne()
    .HasForeignKey<UserPlanMetrics>(m => m.UserId)
    .OnDelete(DeleteBehavior.Cascade);
```

- [ ] **Step 2: Update Program.cs**

Find service registrations and add:
```csharp
builder.Services.AddScoped<CapacityCalculator>();
builder.Services.AddScoped<ActivityMatcher>();
builder.Services.AddScoped<AntiGamingMonitor>();
builder.Services.AddScoped<IDailyPlanService, DailyPlanService>();
```

Find hub mappings and add:
```csharp
app.MapHub<DailyPlanHub>("/hubs/daily-plan");
```

- [ ] **Step 3: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\backend && dotnet build`
Expected: Build succeeded. 0 Warning(s) 0 Error(s)

---

### Task 10: Add DailyPlan Types to Frontend

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add DailyPlan types**

Add after the Task types section:
```typescript
// Daily Plan types
export interface DailyPlanTask {
  id: string;
  plannedStart: string;
  actualStart?: string;
  delayMinutes: number;
  plannedDurationMinutes: number;
  category: 'MUST_DO' | 'SHOULD_DO' | 'NICE_TO_HAVE';
  score: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED_AUTO' | 'COMPLETED_MANUAL' | 'SKIPPED' | 'EXPIRED' | 'OFF_TRACK';
  isLowConfidence: boolean;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  taskType: string;
  dealValue?: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
}

export interface DailyPlan {
  id: string;
  date: string;
  status: 'ON_TRACK' | 'OFF_TRACK' | 'COMPLETED' | 'NOT_STARTED';
  activeTaskId?: string;
  completionRate: number;
  confidenceScore: number;
  isRecoveryMode: boolean;
  capacity: CapacityInfo;
  mustDo: DailyPlanTask[];
  shouldDo: DailyPlanTask[];
  niceToHave: DailyPlanTask[];
}

export interface CapacityInfo {
  mustDoLimit: number;
  shouldDoLimit: number;
  startTime: string;
  mode: 'NORMAL' | 'RECOVERY' | 'STRETCH';
}

export interface ManualCompleteRequest {
  reasonCode: string;
  note?: string;
}

export interface SkipTaskRequest {
  reasonCode: string;
  note?: string;
}

export interface TeamDailyPlan {
  date: string;
  teamPlans: TeamMemberPlan[];
  summary: TeamSummary;
}

export interface TeamMemberPlan {
  salesId: string;
  salesName: string;
  planStatus: string;
  activeTask?: { task: string; startedAt?: string };
  completed: number;
  mustDo: number;
  overdueCount: number;
  lastActivityAt?: string;
}

export interface TeamSummary {
  teamOnTrack: number;
  teamOffTrack: number;
  teamNotStarted: number;
  totalCompleted: number;
  totalMustDo: number;
}
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\frontend && npm run build 2>&1 | Select-Object -Last 5`
Expected: No TypeScript errors

---

### Task 11: Create dailyPlanService.ts

**Files:**
- Create: `frontend/src/services/dailyPlanService.ts`

- [ ] **Step 1: Create dailyPlanService.ts**

```typescript
import api from './api';
import { DailyPlan, CapacityInfo, ManualCompleteRequest, SkipTaskRequest, TeamDailyPlan } from '../types';

export const dailyPlanService = {
  getTodayPlan: async (): Promise<DailyPlan> => {
    const response = await api.get('/daily-plan');
    return response.data;
  },

  getPlanForDate: async (date: string): Promise<DailyPlan> => {
    const response = await api.get(`/daily-plan/${date}`);
    return response.data;
  },

  completeTask: async (taskId: string, request: ManualCompleteRequest): Promise<void> => {
    await api.post(`/daily-plan/${taskId}/complete`, request);
  },

  skipTask: async (taskId: string, request: SkipTaskRequest): Promise<void> => {
    await api.post(`/daily-plan/${taskId}/skip`, request);
  },

  activateTask: async (taskId: string): Promise<void> => {
    await api.post(`/daily-plan/${taskId}/activate`);
  },

  getCapacity: async (): Promise<CapacityInfo> => {
    const response = await api.get('/daily-plan/capacity');
    return response.data;
  },

  updateCapacity: async (request: Partial<CapacityInfo>): Promise<CapacityInfo> => {
    const response = await api.put('/daily-plan/capacity', request);
    return response.data;
  },

  getTeamPlans: async (date?: string): Promise<TeamDailyPlan> => {
    const params = date ? { date } : {};
    const response = await api.get('/daily-plan/team', { params });
    return response.data;
  },
};
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\frontend && npm run build 2>&1 | Select-Object -Last 5`
Expected: No TypeScript errors

---

### Task 12: Create useDailyPlan.ts Hook

**Files:**
- Create: `frontend/src/hooks/useDailyPlan.ts`

- [ ] **Step 1: Create useDailyPlan.ts**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { dailyPlanService } from '../services/dailyPlanService';
import { DailyPlan, ManualCompleteRequest, SkipTaskRequest } from '../types';

export function useDailyPlan() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dailyPlanService.getTodayPlan();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const completeTask = useCallback(async (taskId: string, request: ManualCompleteRequest) => {
    await dailyPlanService.completeTask(taskId, request);
    await loadPlan();
  }, [loadPlan]);

  const skipTask = useCallback(async (taskId: string, request: SkipTaskRequest) => {
    await dailyPlanService.skipTask(taskId, request);
    await loadPlan();
  }, [loadPlan]);

  const activateTask = useCallback(async (taskId: string) => {
    await dailyPlanService.activateTask(taskId);
    await loadPlan();
  }, [loadPlan]);

  return {
    plan,
    loading,
    error,
    completeTask,
    skipTask,
    activateTask,
    refresh: loadPlan,
  };
}
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\frontend && npm run build 2>&1 | Select-Object -Last 5`
Expected: No TypeScript errors

---

### Task 13: Create DailyPlan.tsx Page

**Files:**
- Create: `frontend/src/pages/DailyPlan.tsx`

- [ ] **Step 1: Create DailyPlan.tsx**

```tsx
import { useDailyPlan } from '../hooks/useDailyPlan';
import { Clock, AlertCircle, CheckCircle, MessageCircle, Phone, Calendar } from 'lucide-react';

const categoryColors = {
  MUST_DO: 'border-l-red-500 bg-red-50',
  SHOULD_DO: 'border-l-yellow-500 bg-yellow-50',
  NICE_TO_HAVE: 'border-l-blue-500 bg-white',
};

const statusIcons = {
  PENDING: <Clock className="w-5 h-5 text-slate-400" />,
  IN_PROGRESS: <Phone className="w-5 h-5 text-blue-500" />,
  COMPLETED_AUTO: <CheckCircle className="w-5 h-5 text-green-500" />,
  COMPLETED_MANUAL: <AlertCircle className="w-5 h-5 text-orange-500" />,
  SKIPPED: <MessageCircle className="w-5 h-5 text-slate-400" />,
  EXPIRED: <AlertCircle className="w-5 h-5 text-red-500" />,
  OFF_TRACK: <AlertCircle className="w-5 h-5 text-red-500" />,
};

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function TaskCard({ task, isActive, onActivate, onComplete, onSkip }: {
  task: any;
  isActive: boolean;
  onActivate: () => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const isCompleted = task.status.startsWith('COMPLETED') || task.status === 'SKIPPED';

  return (
    <div className={`border-l-4 ${categoryColors[task.category]} rounded-lg shadow-sm p-4 mb-3 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {statusIcons[task.status] || statusIcons.PENDING}
            {task.plannedStart && (
              <span className="text-sm font-medium text-slate-600">
                {formatTime(task.plannedStart)}
              </span>
            )}
            <h3 className={`font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.taskType === 'CALL' && '📞 '}
              {task.taskType === 'MEETING' && '🤝 '}
              {task.taskType === 'FOLLOW_UP' && '📋 '}
              {task.taskType === 'MESSAGE' && '💬 '}
              {task.doctorName}
            </h3>
          </div>
          <p className="text-sm text-slate-500">{task.hospitalName}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.dealValue && (
              <span className="text-xs font-medium text-slate-600">
                💰 {formatCurrency(task.dealValue)}
              </span>
            )}
            {task.temperature && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.temperature === 'HOT' ? 'bg-red-100 text-red-700' :
                task.temperature === 'WARM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {task.temperature}
              </span>
            )}
            {task.isLowConfidence && (
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                ⚠️ Manual
              </span>
            )}
          </div>
        </div>

        {!isCompleted && (
          <div className="flex gap-2">
            {!isActive && (
              <button
                onClick={onActivate}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                title="Start"
              >
                ▶
              </button>
            )}
            <button
              onClick={onComplete}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
              title="Complete"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={onSkip}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Skip"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const DailyPlan: React.FC = () => {
  const { plan, loading, error, completeTask, skipTask, activateTask } = useDailyPlan();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="text-slate-500">Đang tải...</span></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64"><span className="text-red-500">{error}</span></div>;
  }

  if (!plan) {
    return <div className="flex items-center justify-center h-64"><span className="text-slate-500">Không có kế hoạch</span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📅 Kế hoạch hôm nay</h1>
          <p className="text-slate-500">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className={`px-3 py-1 rounded-full ${plan.isRecoveryMode ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
            {plan.capacity.mode} Mode
          </span>
          <span className="text-slate-600">
            📊 Confidence: {Math.round(plan.confidenceScore * 100)}%
          </span>
        </div>
      </div>

      {plan.status === 'OFF_TRACK' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ Kế hoạch bị trễ ({plan.mustDo.filter(t => t.delayMinutes > 0).length} task)
        </div>
      )}

      {/* MUST DO Section */}
      {plan.mustDo.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            🔥 MUST DO
            <span className="text-sm font-normal text-slate-500">{plan.capacity.mustDoLimit} tasks</span>
          </h2>
          <div>
            {plan.mustDo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={plan.activeTaskId === task.id}
                onActivate={() => activateTask(task.id)}
                onComplete={() => completeTask(task.id, { reasonCode: 'COMPLETED' })}
                onSkip={() => skipTask(task.id, { reasonCode: 'SKIPPED' })}
              />
            ))}
          </div>
        </div>
      )}

      {/* SHOULD DO Section */}
      {plan.shouldDo.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            ⚡ SHOULD DO
            <span className="text-sm font-normal text-slate-500">{plan.capacity.shouldDoLimit} tasks</span>
          </h2>
          <div>
            {plan.shouldDo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={plan.activeTaskId === task.id}
                onActivate={() => activateTask(task.id)}
                onComplete={() => completeTask(task.id, { reasonCode: 'COMPLETED' })}
                onSkip={() => skipTask(task.id, { reasonCode: 'SKIPPED' })}
              />
            ))}
          </div>
        </div>
      )}

      {/* NICE TO HAVE Section */}
      {plan.niceToHave.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            🧊 LATER
          </h2>
          <div>
            {plan.niceToHave.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={plan.activeTaskId === task.id}
                onActivate={() => activateTask(task.id)}
                onComplete={() => completeTask(task.id, { reasonCode: 'COMPLETED' })}
                onSkip={() => skipTask(task.id, { reasonCode: 'SKIPPED' })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\frontend && npm run build 2>&1 | Select-Object -Last 5`
Expected: No TypeScript errors

---

### Task 14: Add DailyPlan Route to App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add route**

Add to lazy imports:
```tsx
const DailyPlan = lazy(() => import('./pages/DailyPlan'));
```

Add to Routes:
```tsx
<Route path="daily-plan" element={<DailyPlan />} />
```

- [ ] **Step 2: Verify build**

Run: `cd C:\Data\StartUp\SaleManager\frontend && npm run build 2>&1 | Select-Object -Last 5`
Expected: No TypeScript errors

---

## Verification

### Backend Build
```bash
cd backend && dotnet build
# Expected: Build succeeded. 0 Warning(s) 0 Error(s)
```

### Frontend Build
```bash
cd frontend && npm run build
# Expected: Build succeeded in X.XXs
```

### Manual Test
1. Login as admin/manager/sales
2. Navigate to /daily-plan
3. Verify plan generates with MUST/SHOULD/NICE categories
4. Test complete, skip, activate actions
5. Check SignalR connection in browser console
