# Follow-up Management MVP - Design Spec

**Date:** 2026-04-26
**Status:** Approved for implementation
**Scope:** MVP - Core Follow-up Workflow (Engagement Board deferred)

---

## 1. Overview

### 1.1 Goal
Enable sales to know what to do each day - follow up with doctors who have tasks due. Temperature tracking helps prioritize HOT doctors.

### 1.2 Out of Scope
- Engagement Board (full drag-drop columns) - deferred to v2
- Priority scoring algorithm - deferred to v2
- Manager team view - deferred to v2

---

## 2. Entity Changes

### 2.1 Add Temperature Enum

**Enums.cs** - Add new enum:
```csharp
public enum Temperature
{
    HOT,
    WARM,
    COLD
}
```

### 2.2 Add Temperature to Doctor

**Doctor.cs** - Add field:
```csharp
public Temperature Temperature { get; set; } = Temperature.WARM;
```

---

## 3. Backend Logic

### 3.1 Auto Temperature Update

When activity created, update doctor's temperature based on result:

```
if activity.Result == ActivityResult.Interested:
    doctor.Temperature = Temperature.HOT
elif activity.Result == ActivityResult.FollowUp:
    doctor.Temperature = Temperature.WARM
else:
    doctor.Temperature = Temperature.COLD
```

### 3.2 Auto Next Action Logic

When activity created:

```
if activity.Type == ActivityType.MEETING:
    doctor.NextFollowUpAt = now + 2 days
elif activity.Type == ActivityType.CALL:
    doctor.NextFollowUpAt = now + 3 days
// Other types: no auto-set
```

### 3.3 API Endpoints

#### GET /api/tasks/today
Returns doctors with overdue or today's tasks.

Response:
```json
[
  {
    "doctorId": "guid",
    "doctorName": "Dr. Nguyen Van A",
    "temperature": "HOT",
    "lastActivityAt": "2026-04-24T10:00:00Z",
    "nextFollowUpAt": "2026-04-26T00:00:00Z",
    "isOverdue": true,
    "lastActivityType": "MEETING"
  }
]
```

#### POST /api/doctors/{id}/temperature
Update doctor's temperature manually.

Request:
```json
{ "temperature": "HOT" }
```

#### POST /api/doctors/{id}/snooze
Delay next follow-up.

Request:
```json
{ "days": 1 }  // 1, 3, or 7
```

---

## 4. Frontend Changes

### 4.1 Tasks Page (/tasks)

**New page: frontend/src/pages/Tasks.tsx**

Layout:
```
┌─────────────────────────────────────┐
│ Today's Tasks              3 tasks  │
├─────────────────────────────────────┤
│ 🔥 Dr. Nguyen Van A      OVERDUE    │
│    Last: Meeting 2 days ago        │
│    [Log Activity] [Change Temp] [Snooze ▼] │
├─────────────────────────────────────┤
│ 🌤 Dr. Tran Thi B         TODAY     │
│    Last: Call 1 day ago            │
│    [Log Activity] [Change Temp] [Snooze ▼] │
└─────────────────────────────────────┘
```

**Sorting:** Overdue first, then by next_follow_up_at

**Temperature badge colors:**
- HOT 🔥: red background
- WARM 🌤: yellow background
- COLD ❄: gray background

### 4.2 Snooze Dropdown

Show dropdown with options:
- Snooze 1 day
- Snooze 3 days
- Snooze 1 week

### 4.3 Temperature Change

Show dropdown:
- Mark as HOT
- Mark as WARM
- Mark as COLD

### 4.4 Log Activity

Click → Navigate to `/activities?doctorId={id}` with Quick Add form pre-opened

---

## 5. Acceptance Criteria

### 5.1 Core Functionality
- [ ] GET /api/tasks/today returns doctors with overdue/today tasks
- [ ] Activity creation auto-updates doctor's temperature
- [ ] Activity creation auto-sets next_follow_up_at for MEETING (+2d) and CALL (+3d)
- [ ] POST /api/doctors/{id}/temperature updates temperature
- [ ] POST /api/doctors/{id}/snooze delays next_follow_up_at

### 5.2 UI
- [ ] Tasks page shows today's tasks sorted overdue first
- [ ] Temperature badge shows correct color
- [ ] Snooze dropdown works with 1/3/7 day options
- [ ] Temperature change dropdown works
- [ ] Log Activity button navigates to activities with doctor pre-selected

### 5.3 Rules
- [ ] Doctors without next_follow_up_at not shown in tasks
- [ ] New doctors default to WARM temperature

---

## 6. File Map

### Backend (Create/Modify)
| File | Change |
|------|--------|
| `backend/Entities/Enums.cs` | Add Temperature enum |
| `backend/Entities/Doctor.cs` | Add Temperature field |
| `backend/Services/IActivityService.cs` | Update temperature logic |
| `backend/Services/ActivityService.cs` | Add auto temperature + next_action |
| `backend/Controllers/TasksController.cs` | New - GET /api/tasks/today |
| `backend/Controllers/DoctorsController.cs` | Add temperature + snooze endpoints |

### Frontend (Create/Modify)
| File | Change |
|------|--------|
| `frontend/src/pages/Tasks.tsx` | New - Tasks page |
| `frontend/src/services/doctorService.ts` | Add temperature/snooze methods |
| `frontend/src/store/...` | May need new store or extend existing |
| `frontend/src/navigation/menuConfig.tsx` | Add Tasks route |

---

## 7. Deferred Features (v2)

- **Engagement Board** - Full drag-drop board with HOT/WARM/COLD columns
- **Priority Scoring** - Complex algorithm with temperature weight + deal probability + days since activity
- **Manager Team View** - See all team members' tasks
- **KPI Tracking** - Follow-up on-time rate, overdue rate, hot conversion rate

---

## 8. Notes

- Temperature is auto-updated but can be manually overridden
- Snooze simply adds days to existing next_follow_up_at
- Only doctors with next_follow_up_at set appear in tasks
