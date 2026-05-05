# Sales Task Page - Hybrid Task System Design

## Date: 2026-05-05
## Author: Sisyphus
## Status: APPROVED

---

## 1. Architecture

**Core Principle:** Tasks are computed views, NOT stored entities.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Doctors   │     │    Deals    │     │ Activities   │
│ (NextFollowUp)│   │(Stage/Date) │     │(LastUpdate) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                  ┌─────────────────┐
                  │  TaskService    │
                  │ (Aggregation)   │
                  └────────┬────────┘
                           ▼
                  ┌─────────────────┐
                  │ GET /api/tasks  │
                  └─────────────────┘
```

---

## 2. Task Types

| Type | Source | Condition |
|------|--------|-----------|
| `FOLLOW_UP` | Doctor.NextFollowUpAt | NextFollowUpAt <= now |
| `DEAL_OVERDUE` | Deal.ExpectedCloseDate | Stage NOT IN (WON, LOST) AND ExpectedCloseDate < now |
| `DEAL_CLOSING` | Deal.ExpectedCloseDate | Stage IN (IN_PROGRESS, NEGOTIATION) AND ExpectedCloseDate <= now + 3days |

---

## 3. Priority Formula

```
basePriority = {
  overdue → 100,
  closeWithin1Day → 95,
  closeWithin3Days → 85
}

bonus = (stage === NEGOTIATION) ? 5 : 0
bonus += (lastActivity > 5days) ? 10 : 0
priority = basePriority + bonus
```

**Priority Order:** 100 (overdue) > 95 (≤1 day) > 90 (NEGOTIATION + ≤1 day) > 85 (≤3 days) > 80 (NEGOTIATION + ≤3 days)

---

## 4. Edge Cases

### Case 1: Deal + Follow-up for same doctor
→ Do NOT merge. Keep 2 separate tasks:
- Dr A – Follow-up overdue
- Dr A – Deal closing

### Case 2: Deal is WON
→ Ignore deal, do not create task

### Case 3: Deal inactive > 5 days
→ bonus += 10 priority

---

## 5. Task Item Structure

```csharp
public class TaskItem
{
    public Guid Id { get; set; }
    public string Type { get; set; }  // FOLLOW_UP, DEAL_CLOSING, DEAL_OVERDUE
    public string Priority { get; set; }  // HIGH, MEDIUM, LOW
    public int Score { get; set; }  // for sorting

    // Doctor info
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; }
    public string HospitalName { get; set; }
    public Temperature Temperature { get; set; }

    // Deal info (nullable for FOLLOW_UP only)
    public Guid? DealId { get; set; }
    public string? DealName { get; set; }
    public decimal? DealValue { get; set; }
    public DealStage? DealStage { get; set; }

    // Timing
    public DateTime DueAt { get; set; }
    public int OverdueDays { get; set; }  // negative if not overdue
    public DateTime? LastActivityAt { get; set; }
}
```

---

## 6. API Endpoints

### GET /api/tasks
**Auth:** Bearer token (SalesMember, SalesManager, Admin)
**Query params:**
- `filter` (optional): ALL | OVERDUE | CLOSING_SOON | TODAY

**Response:**
```json
{
  "tasks": [TaskItem],
  "summary": {
    "total": 12,
    "overdue": 3,
    "closingSoon": 5,
    "today": 4
  }
}
```

### POST /api/tasks/{taskId}/snooze
**Body:** `{ "days": 1 | 3 | 7 }`
**Action:** Updates Doctor.NextFollowUpAt or Deal.ExpectedCloseDate

### POST /api/tasks/{taskId}/complete
**Action:** Marks task as done (updates NextFollowUpAt to tomorrow for FOLLOW_UP)

---

## 7. SignalR Events

**Hub:** `/hubs/tasks`
**Groups:** `Tasks_User_{userId}`

**Events:**
- `TasksUpdated` - full task list refresh
- `TaskCreated` - new task notification
- `TaskCompleted` - task resolved

---

## 8. Frontend UI

### Task Card Design
```
┌─────────────────────────────────────────────┐
│▌ Dr Nguyễn Văn A                            │
│  Bệnh viện Da liễu Trung ương              │
│                                              │
│  🔴 DEAL OVERDUE (2 days)                   │
│  💰 50,000,000 VND | NEGOTIATION           │
│                                              │
│  [📞 Call] [📝 Log] [⏰ Snooze]             │
└─────────────────────────────────────────────┘
```

**Color coding:**
- 🔴 Red border-left: OVERDUE tasks
- 🟠 Orange border-left: Closing soon (≤1 day)
- 🟡 Yellow border-left: Closing soon (≤3 days)
- ⚪ White/Light: FOLLOW_UP today

### Filter Tabs
- **All** - sorted by priority score DESC
- **Overdue** - only overdue tasks
- **Closing Soon** - only DEAL_CLOSING tasks
- **Today** - tasks due today

### Quick Actions
- **Call** - opens `tel:` link
- **Log Activity** - opens activity modal
- **Snooze** - dropdown: 1 day, 3 days, 7 days

---

## 9. Implementation Files

### Backend
| File | Action |
|------|--------|
| `DTOs/TaskDtos.cs` | New - TaskItem, TasksResponse |
| `Services/ITaskService.cs` | New - interface |
| `Services/TaskService.cs` | New - aggregation logic |
| `Services/TaskBackgroundService.cs` | New - triggers broadcasts |
| `Controllers/TasksController.cs` | Update - new endpoints |
| `Hubs/TaskHub.cs` | New - SignalR hub |
| `Program.cs` | Update - register services |

### Frontend
| File | Action |
|------|--------|
| `src/types/index.ts` | Update - add Task types |
| `src/services/taskService.ts` | Update - add endpoints |
| `src/pages/Tasks.tsx` | Rewrite - new UI |
| `src/hooks/useTasks.ts` | New - Zustand-like hook |
| `src/components/tasks/TaskCard.tsx` | New - component |
| `src/components/tasks/TaskFilters.tsx` | New - component |

---

## 10. Acceptance Criteria

1. Tasks computed on-the-fly, no stored Task entity
2. Priority formula: overdue=100, ≤1day=95, ≤3days=85, NEGOTIATION bonus +5, stale bonus +10
3. Tasks from same doctor NOT merged (2 separate cards)
4. WON deals ignored
5. Real-time updates via SignalR
6. Quick actions: Call → tel:, Log → activity modal, Snooze → API call
7. Color-coded by urgency
8. Filter tabs work correctly
