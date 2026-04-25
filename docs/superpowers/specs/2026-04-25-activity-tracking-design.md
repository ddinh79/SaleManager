# Activity Tracking System - MVP Design Spec

**Date:** 2026-04-25
**Status:** Approved for implementation
**Scope:** MVP - Core Activity Flow with GPS (Anti-fake postponed)

---

## 1. Overview

### 1.1 Goal
Track sales activities (calls, meetings, messages) with GPS verification for physical visits, and display in a timeline UI.

### 1.2 Out of Scope (Postponed)
- Anti-fake detection (duplicate, density, mock location)
- Image proof upload
- KPI integration
- Inactive user detection
- Auto call log / Zalo sync

---

## 2. Backend Changes

### 2.1 Entity Extensions

**Hospital.cs** - Add GPS coordinates:
```csharp
public decimal? Lat { get; set; }
public decimal? Lng { get; set; }
```

**Doctor.cs** - Add activity tracking fields:
```csharp
public DateTime? LastActivityAt { get; set; }
public DateTime? NextFollowUpAt { get; set; }
```

**Activity.cs** - Extend for GPS tracking:
```csharp
public GpsStatus GpsStatus { get; set; }  // VALID, SUSPICIOUS, MISSING
public int? DistanceMeters { get; set; }
public string? DeviceId { get; set; }
public string? Result { get; set; }         // interested, not_interested, follow_up_needed
```

**New Enum - GpsStatus:**
```csharp
public enum GpsStatus { VALID, SUSPICIOUS, MISSING }
```

### 2.2 New API Controller

**ActivitiesController.cs**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/activities` | POST | Sales, Manager, Admin | Create activity |
| `/api/activities` | GET | Sales (own), Manager (team), Admin (all) | List with filters |
| `/api/activities/{id}` | GET | Same as above | Get by ID |
| `/api/activities/timeline` | GET | Same as above | Timeline grouped by date |

### 2.3 Create Activity Request

```json
{
  "doctorId": "guid (required)",
  "type": "CALL|MESSAGE|MEETING|DEMO|SAMPLE_SENT (required)",
  "content": "string (required, max 1000)",
  "result": "interested|not_interested|follow_up_needed (optional)",
  "nextFollowUpAt": "datetime (optional)",
  "lat": "decimal (required for MEETING/DEMO)",
  "lng": "decimal (required for MEETING/DEMO)"
}
```

### 2.4 GPS Validation Logic

```
IF activity.type IN (MEETING, DEMO):
  IF lat IS NULL OR lng IS NULL:
    RETURN 400 "GPS coordinates required for MEETING/DEMO"

  hospitalLatLng = hospitalRepository.GetLatLng(doctor.HospitalId)
  IF hospitalLatLng EXISTS:
    distance = Haversine(userLatLng, hospitalLatLng)
    IF distance <= 100 meters:
      gpsStatus = VALID
    ELSE:
      gpsStatus = SUSPICIOUS
  ELSE:
    SKIP GPS validation (hospital has no coordinates)

ELSE (CALL, MESSAGE, SAMPLE_SENT):
  gpsStatus = MISSING (not applicable)
```

### 2.5 Doctor Update Logic

On activity created:
```
doctor.LastActivityAt = UTC NOW
IF activity.nextFollowUpAt IS NOT NULL:
  doctor.NextFollowUpAt = activity.nextFollowUpAt
doctorRepository.Update(doctor)
```

### 2.6 Permission Logic

- **Sales** - Can only create/view own activities
- **Manager** - Can create for any sales on their team; can view team's activities
- **Admin** - Can create/view all activities

### 2.7 Response Shape

```json
{
  "id": "guid",
  "salesId": "guid",
  "salesName": "Nguyen Van A",
  "doctorId": "guid",
  "doctorName": "Dr. Tran Thi B",
  "type": "MEETING",
  "content": "Product demo",
  "result": "interested",
  "nextFollowUpAt": "2026-05-15T00:00:00Z",
  "checkinLat": 10.762,
  "checkinLng": 106.660,
  "gpsStatus": "VALID",
  "distanceMeters": 50,
  "createdAt": "2026-04-25T10:30:00Z"
}
```

### 2.8 Timeline Response

Grouped by date:
```json
{
  "today": [...activities],
  "yesterday": [...activities],
  "dates": {
    "2026-04-23": [...activities],
    "2026-04-22": [...activities]
  }
}
```

---

## 3. Frontend Changes

### 3.1 New Service

**activityService.ts**
```typescript
createActivity(data: CreateActivityRequest): Promise<Activity>
getActivities(filters: ActivityFilters): Promise<Activity[]>
getTimeline(doctorId?: string): Promise<TimelineResponse>
```

### 3.2 New Store

**activityStore.ts** - Zustand store for timeline state:
```typescript
interface ActivityState {
  activities: Activity[]
  timeline: TimelineData
  selectedDoctorId: string | null
  isLoading: boolean
  setSelectedDoctor: (id: string | null) => void
  fetchTimeline: (doctorId?: string) => Promise<void>
}
```

### 3.3 Activities Page Enhancements

**Header:**
- Title: "Activities"
- Doctor filter dropdown (All Doctors + assigned doctors)
- Quick Add button

**Next Follow-up Banner** (if doctor selected):
- Shows doctor's NextFollowUpAt in header area (not as intrusive banner)

**Quick Add Form:**
- Appears when [+ Add Activity] expanded
- Doctor: pre-selected based on context
- Type: defaults to CALL
- Content: required textarea
- Result: optional dropdown
- Next Follow-up: optional date picker
- Submit: disabled if content empty

**Timeline Display:**
```
┌─────────────────────────────────────┐
│ TODAY                               │
│ ┌─────────────────────────────────┐ │
│ │ 📞 Call Dr. A                   │ │
│ │ Discussed new product...        │ │
│ │ ✅ GPS | 10:30 AM               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ YESTERDAY                           │
│ ┌─────────────────────────────────┐ │
│ │ 🤝 Meeting Dr. B                │ │
│ │ Product demo at hospital        │ │
│ │ ⚠️ GPS (150m) | 2:00 PM         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Activity Card States:**
- GPS Badge colors:
  - VALID: green
  - SUSPICIOUS: yellow
  - MISSING: red (gray)

**Expand-in-place:**
- Tap card → animates open to show full details
- Shows result, next follow-up, distance

---

## 4. Acceptance Criteria

### 4.1 Core Functionality
- [ ] Sales can log activity in < 5 seconds via Quick Add
- [ ] GPS validation works for MEETING/DEMO types
- [ ] GPS marked as MISSING when not provided
- [ ] Doctor.last_activity_at updated on activity create
- [ ] Doctor.next_follow_up_at updated if provided

### 4.2 Permissions
- [ ] Sales can only create own activities
- [ ] Manager can create for team members
- [ ] Manager can view team's activities
- [ ] Admin can view all activities

### 4.3 UI
- [ ] Timeline shows Today/Yesterday/Date grouping
- [ ] Quick Add pre-selects doctor based on context
- [ ] Activity card expands to show details
- [ ] GPS badge shows correct status color

### 4.4 API
- [ ] POST /api/activities creates activity
- [ ] GET /api/activities returns filtered list
- [ ] GET /api/activities/timeline returns grouped timeline
- [ ] GPS validation returns correct status

---

## 5. File Map

### Backend (Create/Modify)
| File | Change |
|------|--------|
| `backend/Entities/Activity.cs` | Extend with GpsStatus, DistanceMeters, DeviceId, Result |
| `backend/Entities/Doctor.cs` | Add LastActivityAt, NextFollowUpAt |
| `backend/Entities/Hospital.cs` | Add Lat, Lng |
| `backend/Entities/Enums.cs` | Add GpsStatus enum |
| `backend/Data/AppDbContext.cs` | Add indexes for Activity queries |
| `backend/Services/IActivityService.cs` | New |
| `backend/Services/ActivityService.cs` | New |
| `backend/Repositories/IActivityRepository.cs` | New |
| `backend/Repositories/ActivityRepository.cs` | New |
| `backend/Controllers/ActivitiesController.cs` | New |

### Frontend (Create/Modify)
| File | Change |
|------|--------|
| `frontend/src/services/activityService.ts` | New |
| `frontend/src/store/activityStore.ts` | New |
| `frontend/src/pages/Activities.tsx` | Enhance with real API + Quick Add |

---

## 6. Tech Stack

- **Backend:** .NET 8, EF Core, SQLite
- **Frontend:** React 18, TypeScript, TailwindCSS, Zustand
- **GPS:** Haversine formula for distance calculation

---

## 7. Notes

- Hospital must have lat/lng for GPS validation to work
- If hospital has no coordinates, GPS check is skipped
- Duplicate detection and anti-fake features deferred to v2
