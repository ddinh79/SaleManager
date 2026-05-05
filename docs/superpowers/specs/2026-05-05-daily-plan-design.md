# Auto Daily Plan System - Design Specification v1.1

## Date: 2026-05-05
## Author: Sisyphus
## Status: APPROVED FOR IMPLEMENTATION

---

## 1. Overview

**Purpose:** Generate daily work plans for sales team that combines urgent tasks with time-blocked scheduling, adaptive capacity, and activity-linked completion tracking.

**Core Principle:** "Hoàn thành = có hành động thật (activity), không phải click." - Completion requires real action, not just clicks.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Daily Plan System                           │
├─────────────────────────────────────────────────────────────────┤
│  DailyPlanService                                                │
│  ├── TaskAggregator (from TaskService)                           │
│  ├── CapacityCalculator (auto + guardrails + override)           │
│  ├── PlanBuilder (categorize + time-assign)                     │
│  ├── RescheduleEngine (off-track detection + shift)              │
│  └── ActivityMatcher (auto-complete logic)                      │
├─────────────────────────────────────────────────────────────────┤
│  DailyPlanTask                                                  │
│  ├── PlannedStart / ActualStart / DelayMinutes                 │
│  ├── Status (PENDING → COMPLETED_AUTO/MANUAL → SKIPPED → EXPIRED → OFF_TRACK)
│  ├── IsLowConfidence                                            │
│  └── CompletedActivityId                                         │
├─────────────────────────────────────────────────────────────────┤
│  AntiGamingMonitor                                             │
│  ├── SuspiciousActivityRate                                     │
│  ├── ManualCompletionRatio                                     │
│  └── SkipRate                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ManagerVisibilityService                                      │
│  └── TeamPlanDashboard (real-time)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Models

### 3.1 DailyPlanTask

```csharp
public class DailyPlanTask
{
    public Guid Id { get; set; }
    public Guid DailyPlanId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? DealId { get; set; }

    // Timing
    public DateTime PlannedStart { get; set; }
    public DateTime? ActualStart { get; set; }
    public int DelayMinutes { get; set; }  // actual - planned (negative = early)
    public int PlannedDurationMinutes { get; set; }

    // Classification
    public string Category { get; set; }  // "MUST_DO" | "SHOULD_DO" | "NICE_TO_HAVE"
    public int Score { get; set; }

    // State
    public PlanTaskStatus Status { get; set; }
    public Guid? CompletedActivityId { get; set; }
    public bool IsLowConfidence { get; set; }  // manual completion flag

    // Manual completion fields
    public string ManualReasonCode { get; set; }  // NO_RESPONSE, RESCHEDULED, SENT_MATERIAL, INTERNAL_TASK, OTHER
    public string ManualReasonNote { get; set; }

    // Task info (denormalized for display)
    public string DoctorName { get; set; }
    public string HospitalName { get; set; }
    public string TaskType { get; set; }  // CALL, FOLLOW_UP, MEETING, DEMO, SAMPLE
    public decimal? DealValue { get; set; }
    public string Temperature { get; set; }
}

public enum PlanTaskStatus
{
    PENDING,
    IN_PROGRESS,      // NEW: task is active (focus mode)
    COMPLETED_AUTO,   // completed via activity match
    COMPLETED_MANUAL, // completed manually with reason
    SKIPPED,          // skipped with reason
    EXPIRED,          // end of day, unprocessed
    OFF_TRACK         // NEW: delayed > 15min
}
```

### 3.2 DailyPlan

```csharp
public class DailyPlan
{
    public Guid Id { get; set; }
    public Guid SalesId { get; set; }
    public DateTime Date { get; set; }  // date this plan is for
    public DateTime GeneratedAt { get; set; }

    // Capacity settings used
    public int MustDoLimit { get; set; }
    public int ShouldDoLimit { get; set; }
    public DateTime StartTime { get; set; }

    // Status
    public PlanStatus Status { get; set; }  // ON_TRACK, OFF_TRACK, COMPLETED
    public Guid? ActiveTaskId { get; set; }  // for focus mode - only 1 active at a time

    // Metrics
    public decimal CompletionRate { get; set; }
    public decimal ConfidenceScore { get; set; }
    public bool IsRecoveryMode { get; set; }

    public List<DailyPlanTask> Tasks { get; set; }
}

public enum PlanStatus
{
    ON_TRACK,
    OFF_TRACK,  // tasks delayed > 15min
    COMPLETED,
    NOT_STARTED
}
```

### 3.3 UserPlanSettings

```csharp
public class UserPlanSettings
{
    public Guid UserId { get; set; }

    // User override (within guardrails)
    public decimal? CapacityMultiplierOverride { get; set; }  // 0.8 → 1.2
    public DateTime? PreferredStartTime { get; set; }

    // System-calculated values (read-only for user)
    public int CalculatedMustDoLimit { get; set; }
    public int CalculatedShouldDoLimit { get; set; }
    public decimal AvgTasksPerDay { get; set; }
}
```

### 3.4 UserPlanMetrics

```csharp
public class UserPlanMetrics
{
    public Guid UserId { get; set; }

    // Rolling 7-day metrics
    public int TasksCompleted7d { get; set; }
    public int TasksCompletedManually7d { get; set; }
    public int TasksSkipped7d { get; set; }
    public decimal CompletionRate7d { get; set; }

    // Yesterday metrics
    public decimal CompletionRateYesterday { get; set; }
    public bool IsRecoveryMode { get; set; }

    // Anti-gaming flags
    public bool IsSuspicious { get; set; }
    public string SuspiciousReason { get; set; }  // "manual_ratio_high", "skip_rate_high", "suspicious_activity"
    public DateTime FlaggedAt { get; set; }
    public int SuspiciousActivityCount { get; set; }
}
```

---

## 4. Capacity Calculation

### 4.1 Auto-Calculation Formula

```csharp
avg_tasks_7d = avg(tasks_completed_last_7_days)

auto_must = clamp(round(avg_tasks_7d * 0.4), 3, 8)
auto_should = clamp(round(avg_tasks_7d * 0.8), 5, 15)
```

### 4.2 Guardrails (Hard Limits)

```
must_do ∈ [3, 8]
should_do ∈ [5, 15]
total ≤ 20
```

### 4.3 User Override

```
user_limit = auto_limit * (0.8 → 1.2)
```

- User can adjust ±20% from auto-calculated
- Cannot set below minimum or above maximum
- Override stored in UserPlanSettings

### 4.4 Dynamic Adjustment (Recovery/Stretch Mode)

```csharp
if (completion_rate_yesterday < 0.5)
{
    // Recovery mode
    must *= 0.7;   // -30%
    should *= 0.7;
    is_recovery = true;
}
else if (completion_rate_yesterday > 0.9)
{
    // Stretch mode
    must *= 1.1;   // +10%
    should *= 1.1;
}
```

---

## 5. Task Categorization & Time Assignment

### 5.1 Categorization

```csharp
tasks = getTasks()  // from TaskService
sort by score DESC

must_do = top N tasks (score > 90 or overdue)
should_do = next tasks (score 70-90)
nice_to_have = rest
```

### 5.2 Time Slot Assignment (MUST DO only)

```csharp
start = user.preferred_start_time ?? 09:00

for task in must_do:
    task.PlannedStart = start
    task.PlannedDurationMinutes = getDuration(task.type)
    start += task.PlannedDurationMinutes + 5  // 5min buffer
```

### 5.3 Duration Mapping

| Task Type | Duration |
|-----------|----------|
| CALL | 10-15 min |
| FOLLOW_UP | 10 min |
| MEETING | 45-60 min |
| DEMO | 45 min |
| SAMPLE | 30 min |

---

## 6. Completion Tracking

### 6.1 State Machine

```
PENDING → IN_PROGRESS (when activated in focus mode)
        → COMPLETED_AUTO (activity matched)
        → COMPLETED_MANUAL (with reason code)
        → SKIPPED (with reason code)
        → EXPIRED (end of day, unprocessed)
        → OFF_TRACK (delayed > 15min)
```

### 6.2 Activity Auto-Complete Matching

**Window:** ±2 hours around planned_time

**Match Criteria:**
- activity.sales_id == task.sales_id
- activity.doctor_id == task.doctor_id
- activity.type ∈ mapped_types(task.type)
- activity.created_at within window

**Activity Type Mapping:**

| Task Type | Valid Activity Types |
|-----------|----------------------|
| CALL | CALL |
| FOLLOW_UP | CALL, MESSAGE |
| MEETING | MEETING |
| DEMO | DEMO |
| SAMPLE | SAMPLE |
| INTERNAL | (manual only) |

### 6.3 Manual Completion (Guarded)

**Only allowed when no valid activity exists:**
```csharp
if (no valid activity)
{
    require:
        reason_code (enum)
        note (optional, max 200 chars)

    mark COMPLETED_MANUAL
    is_low_confidence = true
}
```

**Reason Codes:**
- `NO_RESPONSE` - Patient didn't respond
- `RESCHEDULED` - Appointment rescheduled
- `SENT_MATERIAL` - Sent materials instead
- `INTERNAL_TASK` - Internal work (not patient-related)
- `OTHER` - Requires note

### 6.4 Quality Weights

| Completion Type | Weight |
|-----------------|--------|
| COMPLETED_AUTO (valid) | 1.0 |
| COMPLETED_MANUAL | 0.5 |
| SKIPPED | 0.2 |
| EXPIRED | 0 |

```csharp
completion_rate = sum(quality_weights) / total_tasks
```

---

## 7. Anti-Gaming System

### 7.1 Hard Stops

```csharp
// Rule 1: Suspicious activity rate
if (suspicious_activity_rate > 0.3)
    exclude_user_from_capacity_calculation();

// Rule 2: Manual completion ratio
if (manual_completion_ratio > 0.5)
    apply_manual_weight = 0.3;  // further reduce weight

// Rule 3: Skip rate
if (skip_rate > 0.3)
    reduce_capacity_by_20%;
```

### 7.2 Anti-Fake Guards

| Guard | Threshold | Action |
|-------|-----------|--------|
| Activity duration < 10s | Any | Not valid for auto-complete |
| GPS mismatch (MEETING/DEMO) | Any | Flag suspicious |
| Spam activities in 5min | > 3 | Only 1 counts |
| Suspicious activity rate | > 30% | Exclude from capacity calc |

---

## 8. Reschedule Engine

### 8.1 Off-Track Detection

```csharp
if (delay_minutes > 15 && status == PENDING)
{
    status = OFF_TRACK;
}
```

### 8.2 Auto-Reschedule Option

```csharp
public void RescheduleIfNeeded(DailyPlan plan)
{
    var offTrackTasks = plan.Tasks
        .Where(t => t.Status == PlanTaskStatus.OFF_TRACK)
        .ToList();

    if (offTrackTasks.Any())
    {
        plan.Status = PlanStatus.OFF_TRACK;

        // Shift remaining tasks
        var totalDelay = offTrackTasks.Sum(t => t.DelayMinutes);
        foreach (var task in plan.Tasks.Where(t => t.Status == PENDING))
        {
            task.PlannedStart = task.PlannedStart.AddMinutes(totalDelay);
        }
    }
}
```

### 8.3 User Options When Off-Track

```
⚠️ Plan is off-track (15min behind)
   [Recalculate] [Continue Anyway]
```

---

## 9. Focus Mode (Task Lock)

### 9.1 Purpose

- Forces single-task focus
- Reduces fake multitasking
- Creates accountability

### 9.2 Implementation

```csharp
public class DailyPlan
{
    public Guid? ActiveTaskId { get; set; }  // only 1 task at a time
}
```

### 9.3 UI Display

```
┌─────────────────────────────────────┐
│ ▶ Current Task                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 09:00  📞 Call Dr A (Overdue)       │
│        [Complete] [Skip] [Snooze]   │
│                                     │
│ 09:15  📞 Call Dr B (waiting...)    │
│ 10:00  🤝 Meeting Dr C               │
└─────────────────────────────────────┘
```

---

## 10. Manager Visibility

### 10.1 Team Plan Endpoint

`GET /api/daily-plan/team` (Manager/Admin only)

### 10.2 Response

```json
{
  "date": "2026-01-05",
  "teamPlans": [
    {
      "salesId": "uuid",
      "salesName": "Minh Sales",
      "planStatus": "OFF_TRACK",
      "activeTask": { "task": "Call Dr A", "startedAt": "09:05" },
      "completed": 3,
      "mustDo": 5,
      "overdueCount": 1,
      "lastActivityAt": "09:05"
    }
  ],
  "summary": {
    "teamOnTrack": 4,
    "teamOffTrack": 1,
    "teamNotStarted": 1,
    "totalCompleted": 15,
    "totalMustDo": 25
  }
}
```

### 10.3 Manager Dashboard UI

```
┌─────────────────────────────────────────────────────┐
│ Team Daily Plans              🔴 2 OFF TRACK      │
├─────────────────────────────────────────────────────┤
│ 🔴 Minh Sales     OFF TRACK    09:15 Call Dr A    │
│ 🟢 Hùng Sales     ON TRACK     Meeting Dr B      │
│ 🟡 Lan Sales      ON TRACK      2/5 completed      │
│ ⚪ Chi Sales      NOT STARTED                       │
└─────────────────────────────────────────────────────┘
```

---

## 11. Bonus Features

### 11.1 Plan Confidence Score

```csharp
public decimal CalculateConfidence(User user, DailyPlan plan)
{
    var pastCompletion = user.metrics.completion_rate_7d;
    var overdueRate = plan.Tasks.Count(t => t.OverdueDays > 0)
                     / plan.Tasks.Count;

    return (pastCompletion * 0.7m) + ((1 - overdueRate) * 0.3m);
}
```

**Display:**
```
📊 Plan Confidence: 78%
   Based on: 85% past completion, 3 overdue tasks
```

### 11.2 Energy-Based Scheduling

```csharp
public void ApplyEnergyScheduling(List<DailyPlanTask> tasks)
{
    // Morning (09:00-12:00): High-priority tasks
    var morning = tasks.Where(t => t.PlannedStart.Hour < 12);
    foreach (var t in morning.OrderByDescending(t => t.Score))
        t.RecommendedEnergy = "HIGH";

    // Afternoon (12:00-17:00): Follow-ups, messages
    var afternoon = tasks.Where(t => t.PlannedStart.Hour >= 12);
    foreach (var t in afternoon)
        t.RecommendedEnergy = "LOW";
}
```

---

## 12. API Endpoints

### 12.1 Core Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/daily-plan` | GET | SalesMember+ | Get today's daily plan |
| `/api/daily-plan/{date}` | GET | SalesMember+ | Get plan for specific date |
| `/api/daily-plan/{taskId}/complete` | POST | SalesMember+ | Manual complete with reason |
| `/api/daily-plan/{taskId}/skip` | POST | SalesMember+ | Skip with reason |
| `/api/daily-plan/{taskId}/activate` | POST | SalesMember+ | Set as active task |
| `/api/daily-plan/capacity` | GET | SalesMember+ | Get user's capacity settings |
| `/api/daily-plan/capacity` | PUT | SalesMember+ | Update capacity override |
| `/api/daily-plan/team` | GET | Manager+ | Get team's plans |

### 12.2 Request/Response Examples

**GET /api/daily-plan**
```json
{
  "plan": {
    "id": "uuid",
    "date": "2026-01-05",
    "status": "ON_TRACK",
    "activeTaskId": "task-uuid",
    "completionRate": 0.6,
    "confidenceScore": 0.85,
    "isRecoveryMode": false,
    "capacity": {
      "mustDoLimit": 5,
      "shouldDoLimit": 10,
      "startTime": "09:00",
      "mode": "NORMAL"
    }
  },
  "mustDo": [...tasks with time slots...],
  "shouldDo": [...ordered tasks...],
  "niceToHave": [...]
}
```

**POST /api/daily-plan/{taskId}/complete**
```json
{
  "reasonCode": "NO_RESPONSE",  // required for manual
  "note": "Patient requested callback tomorrow"  // optional
}
```

---

## 13. SignalR Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `TaskAutoCompleted` | `{ taskId, activityId }` | Activity matches task |
| `TaskCompleted` | `{ taskId, type }` | Manual complete |
| `TaskSkipped` | `{ taskId, reason }` | Task skipped |
| `PlanUpdated` | `{ planId }` | Plan regenerated |
| `PlanOffTrack` | `{ planId, reason }` | Plan goes off track |
| `ActiveTaskChanged` | `{ planId, taskId }` | Focus mode switch |

---

## 14. Frontend UI

### 14.1 Daily Plan Page Layout

```
┌────────────────────────────────────────┐
│ 📅 Thứ 2, 5 Jan 2026                  │
│ Capacity: 5 MUST | 10 SHOULD | 09:00  │
├────────────────────────────────────────┤
│ 🔥 MUST DO                     09:00 ───│
│ ┌────────────────────────────────────┐ │
│ │ ▶ 09:00  📞 Call Dr A (Overdue)   │ │
│ │      09:15  📞 Call Dr B          │ │
│ │      10:00  🤝 Meeting Dr C       │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ ⚡ SHOULD DO                           │
│ ┌────────────────────────────────────┐ │
│ │ • Follow-up Dr D (15m)         ✓   │ │
│ │ • Message Dr E (5m)            ✓   │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ 🧊 LATER                               │
│ • Clean CRM data                      │
├────────────────────────────────────────┤
│ 📊 Confidence: 85% | 📅 Last: 3/5 done │
└────────────────────────────────────────┘
```

### 14.2 Completion Badges

| Badge | Meaning |
|-------|---------|
| ✅ | Auto-completed (valid activity) |
| ⚠️ | Manual completed (low confidence) |
| ⛔ | Expired (end of day) |
| 🔴 | Off-track (delayed) |

---

## 15. File Structure

### Backend - New Files

| File | Purpose |
|------|---------|
| `DTOs/DailyPlanDtos.cs` | Request/Response DTOs |
| `Entities/DailyPlan.cs` | DailyPlan entity |
| `Entities/DailyPlanTask.cs` | DailyPlanTask entity |
| `Entities/UserPlanSettings.cs` | User settings entity |
| `Entities/UserPlanMetrics.cs` | User metrics entity |
| `Services/IDailyPlanService.cs` | Interface |
| `Services/DailyPlanService.cs` | Main service |
| `Services/CapacityCalculator.cs` | Capacity calculation |
| `Services/ActivityMatcher.cs` | Auto-complete matching |
| `Services/AntiGamingMonitor.cs` | Anti-gaming logic |
| `Controllers/DailyPlanController.cs` | API endpoints |
| `Hubs/DailyPlanHub.cs` | SignalR hub |

### Backend - Modified Files

| File | Changes |
|------|---------|
| `Program.cs` | Register services, map hub |
| `AppDbContext.cs` | Add DailyPlan, DailyPlanTask, UserPlanSettings, UserPlanMetrics |

### Frontend - New Files

| File | Purpose |
|------|---------|
| `pages/DailyPlan.tsx` | Main daily plan page |
| `hooks/useDailyPlan.ts` | Daily plan state hook |
| `services/dailyPlanService.ts` | API calls |
| `components/daily-plan/TaskCard.tsx` | Task card component |
| `components/daily-plan/FocusMode.tsx` | Focus mode UI |

### Frontend - Modified Files

| File | Changes |
|------|---------|
| `App.tsx` | Add daily plan route |
| `types/index.ts` | Add DailyPlan types |

---

## 16. Acceptance Criteria

1. ✅ Daily plan generates with MUST_DO/SHOULD_DO/NICE_TO_HAVE categories
2. ✅ MUST_DO tasks have time slots (09:00, 09:15, 10:00...)
3. ✅ Capacity auto-calculated with guardrails [3-8] for MUST, [5-15] for SHOULD
4. ✅ User can override capacity ±20%
5. ✅ Tasks auto-complete when matching activity logged within ±2hr window
6. ✅ Manual completion requires reason code
7. ✅ Quality weights applied: AUTO=1.0, MANUAL=0.5, SKIPPED=0.2
8. ✅ OFF_TRACK detection when delay > 15min
9. ✅ Focus mode: only 1 active task at a time
10. ✅ Anti-gaming: suspicious activity rate > 30% excluded
11. ✅ Manager team view shows all sales status
12. ✅ Confidence score calculated from past completion
13. ✅ Recovery mode reduces capacity after low completion day
14. ✅ SignalR updates in real-time
