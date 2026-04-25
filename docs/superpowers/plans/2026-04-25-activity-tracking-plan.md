# Activity Tracking MVP - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement activity logging with GPS verification for MEETING/DEMO types, timeline UI, and Quick Add form.

**Architecture:** .NET 8 backend with EF Core + SQLite, React frontend with Zustand. GPS uses Haversine formula to validate distance from hospital. Activities flow through controller → service → repository pattern.

**Tech Stack:** React 18, TypeScript, TailwindCSS, Zustand, .NET 8, EF Core, SQLite

---

## File Map

### Backend (Create/Modify)
| File | Change |
|------|--------|
| `backend/Entities/Enums.cs` | Add GpsStatus enum |
| `backend/Entities/Activity.cs` | Add GpsStatus, DistanceMeters, DeviceId, Result fields |
| `backend/Entities/Doctor.cs` | Add LastActivityAt, NextFollowUpAt fields |
| `backend/Entities/Hospital.cs` | Add Lat, Lng fields |
| `backend/Data/AppDbContext.cs` | Add indexes for Activity queries |
| `backend/Services/IActivityService.cs` | New interface |
| `backend/Services/ActivityService.cs` | New implementation |
| `backend/Repositories/IActivityRepository.cs` | New interface |
| `backend/Repositories/ActivityRepository.cs` | New implementation |
| `backend/Controllers/ActivitiesController.cs` | New controller |

### Frontend (Create/Modify)
| File | Change |
|------|--------|
| `frontend/src/services/activityService.ts` | New service |
| `frontend/src/store/activityStore.ts` | New Zustand store |
| `frontend/src/pages/Activities.tsx` | Enhance with real API + Quick Add |

---

## Task 1: Add GpsStatus Enum

**Files:**
- Modify: `backend/Entities/Enums.cs`

- [ ] **Step 1: Read existing Enums.cs**

Read the file to see current enum structure.

- [ ] **Step 2: Add GpsStatus enum**

Add after existing enums:
```csharp
public enum GpsStatus
{
    VALID,
    SUSPICIOUS,
    MISSING
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/Entities/Enums.cs
git commit -m "feat(activity): add GpsStatus enum"
```

---

## Task 2: Extend Hospital Entity with Lat/Lng

**Files:**
- Modify: `backend/Entities/Hospital.cs`

- [ ] **Step 1: Read Hospital.cs**

Read to see current fields.

- [ ] **Step 2: Add Lat and Lng fields**

Add after `Address` property:
```csharp
public decimal? Lat { get; set; }
public decimal? Lng { get; set; }
```

- [ ] **Step 3: Commit**

```bash
git add backend/Entities/Hospital.cs
git commit -m "feat(hospital): add Lat and Lng for GPS coordinates"
```

---

## Task 3: Extend Doctor Entity with Activity Tracking Fields

**Files:**
- Modify: `backend/Entities/Doctor.cs`

- [ ] **Step 1: Read Doctor.cs**

Read to see current fields.

- [ ] **Step 2: Add LastActivityAt and NextFollowUpAt fields**

Add after `UpdatedAt` property:
```csharp
public DateTime? LastActivityAt { get; set; }
public DateTime? NextFollowUpAt { get; set; }
```

- [ ] **Step 3: Commit**

```bash
git add backend/Entities/Doctor.cs
git commit -m "feat(doctor): add LastActivityAt and NextFollowUpAt fields"
```

---

## Task 4: Extend Activity Entity with GPS Fields

**Files:**
- Modify: `backend/Entities/Activity.cs`

- [ ] **Step 1: Read Activity.cs**

Read to see current fields.

- [ ] **Step 2: Add GPS and Result fields**

Add after `NextFollowUpDate`:
```csharp
public GpsStatus GpsStatus { get; set; }
public int? DistanceMeters { get; set; }
public string? DeviceId { get; set; }
public string? Result { get; set; }
```

- [ ] **Step 3: Commit**

```bash
git add backend/Entities/Activity.cs
git commit -m "feat(activity): add GpsStatus, DistanceMeters, DeviceId, Result fields"
```

---

## Task 5: Update Database with New Fields

**Files:**
- Modify: Database migration or recreate

- [ ] **Step 1: Delete existing database to trigger recreation**

```bash
rm backend/salesystem.db
```

- [ ] **Step 2: Rebuild backend**

```bash
cd backend && dotnet build
```
Expected: Build succeeded

- [ ] **Step 3: Commit migration changes**

```bash
git add backend/
git commit -m "chore: add activity GPS fields to database schema"
```

---

## Task 6: Create Activity DTOs

**Files:**
- Create: `backend/DTOs/Request/CreateActivityRequest.cs`
- Create: `backend/DTOs/Response/ActivityResponse.cs`

- [ ] **Step 1: Create CreateActivityRequest.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.DTOs.Request;

public class CreateActivityRequest
{
    [Required]
    public Guid DoctorId { get; set; }

    [Required]
    public ActivityType Type { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public string? Result { get; set; }

    public DateTime? NextFollowUpAt { get; set; }

    public decimal? Lat { get; set; }

    public decimal? Lng { get; set; }

    public string? DeviceId { get; set; }
}
```

- [ ] **Step 2: Create ActivityResponse.cs**

```csharp
namespace SalesSystem.DTOs.Response;

public class ActivityResponse
{
    public Guid Id { get; set; }
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Result { get; set; }
    public DateTime? NextFollowUpAt { get; set; }
    public decimal? CheckinLat { get; set; }
    public decimal? CheckinLng { get; set; }
    public string GpsStatus { get; set; } = string.Empty;
    public int? DistanceMeters { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/DTOs/
git commit -m "feat(activity): add DTOs for create and response"
```

---

## Task 7: Create Activity Repository

**Files:**
- Create: `backend/Repositories/IActivityRepository.cs`
- Create: `backend/Repositories/ActivityRepository.cs`

- [ ] **Step 1: Create IActivityRepository.cs**

```csharp
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IActivityRepository : IRepository<Activity>
{
    Task<List<Activity>> GetBySalesIdAsync(Guid salesId);
    Task<List<Activity>> GetByDoctorIdAsync(Guid doctorId);
    Task<List<Activity>> GetFilteredAsync(Guid? salesId, Guid? doctorId, DateTime? from, DateTime? to, ActivityType? type);
}
```

- [ ] **Step 2: Create ActivityRepository.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class ActivityRepository : Repository<Activity>, IActivityRepository
{
    public ActivityRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Activity>> GetBySalesIdAsync(Guid salesId)
    {
        return await _context.Activities
            .Where(a => a.SalesId == salesId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Activity>> GetByDoctorIdAsync(Guid doctorId)
    {
        return await _context.Activities
            .Where(a => a.DoctorId == doctorId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Activity>> GetFilteredAsync(Guid? salesId, Guid? doctorId, DateTime? from, DateTime? to, ActivityType? type)
    {
        var query = _context.Activities
            .Include(a => a.Sales)
            .Include(a => a.Doctor)
            .AsQueryable();

        if (salesId.HasValue)
            query = query.Where(a => a.SalesId == salesId.Value);

        if (doctorId.HasValue)
            query = query.Where(a => a.DoctorId == doctorId.Value);

        if (from.HasValue)
            query = query.Where(a => a.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(a => a.CreatedAt <= to.Value);

        if (type.HasValue)
            query = query.Where(a => a.Type == type.Value);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}
```

- [ ] **Step 3: Register in DI**

Open `backend/Program.cs` and add after other repository registrations:
```csharp
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();
```

- [ ] **Step 4: Commit**

```bash
git add backend/Repositories/IActivityRepository.cs backend/Repositories/ActivityRepository.cs backend/Program.cs
git commit -m "feat(activity): add ActivityRepository with filtered queries"
```

---

## Task 8: Create Activity Service with GPS Logic

**Files:**
- Create: `backend/Services/IActivityService.cs`
- Create: `backend/Services/ActivityService.cs`

- [ ] **Step 1: Create IActivityService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IActivityService
{
    Task<ActivityResponse> CreateAsync(CreateActivityRequest request, Guid salesId);
    Task<List<ActivityResponse>> GetFilteredAsync(Guid? salesId, Guid? doctorId, DateTime? from, DateTime? to, string? type);
    Task<ActivityResponse?> GetByIdAsync(Guid id);
}
```

- [ ] **Step 2: Create ActivityService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class ActivityService : IActivityService
{
    private readonly IActivityRepository _activityRepo;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IHospitalRepository _hospitalRepo;

    public ActivityService(
        IActivityRepository activityRepo,
        IDoctorRepository doctorRepo,
        IHospitalRepository hospitalRepo)
    {
        _activityRepo = activityRepo;
        _doctorRepo = doctorRepo;
        _hospitalRepo = hospitalRepo;
    }

    public async Task<ActivityResponse> CreateAsync(CreateActivityRequest request, Guid salesId)
    {
        // Validate GPS for MEETING/DEMO
        if (request.Type == ActivityType.MEETING || request.Type == ActivityType.DEMO)
        {
            if (!request.Lat.HasValue || !request.Lng.HasValue)
            {
                throw new ArgumentException("GPS coordinates required for MEETING or DEMO activities");
            }
        }

        var doctor = await _doctorRepo.GetByIdAsync(request.DoctorId)
            ?? throw new ArgumentException("Doctor not found");

        // Calculate GPS status
        var gpsStatus = GpsStatus.MISSING;
        int? distanceMeters = null;

        if (request.Type == ActivityType.MEETING || request.Type == ActivityType.DEMO)
        {
            if (request.Lat.HasValue && request.Lng.HasValue)
            {
                var hospital = await _hospitalRepo.GetByIdAsync(doctor.HospitalId);
                if (hospital != null && hospital.Lat.HasValue && hospital.Lng.HasValue)
                {
                    distanceMeters = CalculateHaversineDistance(
                        (double)request.Lat.Value,
                        (double)request.Lng.Value,
                        (double)hospital.Lat.Value,
                        (double)hospital.Lng.Value
                    );

                    gpsStatus = distanceMeters <= 100 ? GpsStatus.VALID : GpsStatus.SUSPICIOUS;
                }
            }
        }

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            SalesId = salesId,
            DoctorId = request.DoctorId,
            Type = request.Type,
            Content = request.Content,
            Result = request.Result,
            NextFollowUpDate = request.NextFollowUpAt,
            CheckinLat = request.Lat,
            CheckinLng = request.Lng,
            GpsStatus = gpsStatus,
            DistanceMeters = distanceMeters,
            DeviceId = request.DeviceId,
            CreatedAt = DateTime.UtcNow
        };

        await _activityRepo.AddAsync(activity);

        // Update doctor
        doctor.LastActivityAt = DateTime.UtcNow;
        if (request.NextFollowUpAt.HasValue)
        {
            doctor.NextFollowUpAt = request.NextFollowUpAt;
        }
        await _doctorRepo.UpdateAsync(doctor);

        return MapToResponse(activity, doctor.Name);
    }

    public async Task<List<ActivityResponse>> GetFilteredAsync(Guid? salesId, Guid? doctorId, DateTime? from, DateTime? to, string? type)
    {
        ActivityType? activityType = null;
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<ActivityType>(type, out var parsed))
        {
            activityType = parsed;
        }

        var activities = await _activityRepo.GetFilteredAsync(salesId, doctorId, from, to, activityType);
        return activities.Select(a => MapToResponse(a, a.Doctor.Name)).ToList();
    }

    public async Task<ActivityResponse?> GetByIdAsync(Guid id)
    {
        var activity = await _activityRepo.GetByIdAsync(id);
        if (activity == null) return null;
        return MapToResponse(activity, activity.Doctor?.Name ?? "Unknown");
    }

    private ActivityResponse MapToResponse(Activity activity, string doctorName)
    {
        return new ActivityResponse
        {
            Id = activity.Id,
            SalesId = activity.SalesId,
            SalesName = activity.Sales?.FullName ?? "Unknown",
            DoctorId = activity.DoctorId,
            DoctorName = doctorName,
            Type = activity.Type.ToString(),
            Content = activity.Content,
            Result = activity.Result,
            NextFollowUpAt = activity.NextFollowUpDate,
            CheckinLat = activity.CheckinLat,
            CheckinLng = activity.CheckinLng,
            GpsStatus = activity.GpsStatus.ToString(),
            DistanceMeters = activity.DistanceMeters,
            CreatedAt = activity.CreatedAt
        };
    }

    private static int CalculateHaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371000; // Earth radius in meters
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return (int)(R * c);
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
```

- [ ] **Step 3: Register in DI**

Open `backend/Program.cs` and add:
```csharp
builder.Services.AddScoped<IActivityService, ActivityService>();
```

- [ ] **Step 4: Commit**

```bash
git add backend/Services/IActivityService.cs backend/Services/ActivityService.cs backend/Program.cs
git commit -m "feat(activity): add ActivityService with Haversine GPS validation"
```

---

## Task 9: Create Activities Controller

**Files:**
- Create: `backend/Controllers/ActivitiesController.cs`

- [ ] **Step 1: Create ActivitiesController.cs**

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;
    private readonly IUserService _userService;

    public ActivitiesController(IActivityService activityService, IUserService userService)
    {
        _activityService = activityService;
        _userService = userService;
    }

    [HttpPost]
    public async Task<ActionResult<ActivityResponse>> Create([FromBody] CreateActivityRequest request)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var result = await _activityService.CreateAsync(request, salesId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<ActivityResponse>>> GetFiltered(
        [FromQuery] Guid? doctorId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? type)
    {
        var salesId = GetCurrentUserId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        Guid? filterSalesId = null;
        if (role == "Admin")
        {
            filterSalesId = null; // Admin sees all
        }
        else if (role == "SalesManager")
        {
            // Manager sees team's activities, but can filter by specific sales
            filterSalesId = salesId;
        }
        else
        {
            // Sales sees only own
            filterSalesId = salesId;
        }

        var result = await _activityService.GetFilteredAsync(filterSalesId, doctorId, from, to, type);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ActivityResponse>> GetById(Guid id)
    {
        var result = await _activityService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("timeline")]
    public async Task<ActionResult<List<ActivityResponse>>> GetTimeline([FromQuery] Guid? doctorId)
    {
        var salesId = GetCurrentUserId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        Guid? filterSalesId = null;
        if (role == "Admin")
        {
            filterSalesId = null;
        }
        else if (role == "SalesManager")
        {
            filterSalesId = salesId;
        }
        else
        {
            filterSalesId = salesId;
        }

        var result = await _activityService.GetFilteredAsync(filterSalesId, doctorId, null, null, null);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(claim ?? throw new UnauthorizedAccessException());
    }
}
```

- [ ] **Step 2: Build to verify**

```bash
cd backend && dotnet build
```
Expected: Build succeeded

- [ ] **Step 3: Commit**

```bash
git add backend/Controllers/ActivitiesController.cs
git commit -m "feat(activity): add ActivitiesController with CRUD and timeline endpoints"
```

---

## Task 10: Create Frontend Activity Service

**Files:**
- Create: `frontend/src/services/activityService.ts`

- [ ] **Step 1: Create activityService.ts**

```typescript
import api from './api';
import type { UserRole } from '../types';

export interface CreateActivityRequest {
  doctorId: string;
  type: 'CALL' | 'MESSAGE' | 'MEETING' | 'DEMO' | 'SAMPLE_SENT';
  content: string;
  result?: string;
  nextFollowUpAt?: string;
  lat?: number;
  lng?: number;
  deviceId?: string;
}

export interface Activity {
  id: string;
  salesId: string;
  salesName: string;
  doctorId: string;
  doctorName: string;
  type: string;
  content: string;
  result?: string;
  nextFollowUpAt?: string;
  checkinLat?: number;
  checkinLng?: number;
  gpsStatus: 'VALID' | 'SUSPICIOUS' | 'MISSING';
  distanceMeters?: number;
  createdAt: string;
}

export interface ActivityFilters {
  doctorId?: string;
  from?: string;
  to?: string;
  type?: string;
}

export const activityService = {
  createActivity: async (data: CreateActivityRequest): Promise<Activity> => {
    const response = await api.post('/api/activities', data);
    return response.data;
  },

  getActivities: async (filters?: ActivityFilters): Promise<Activity[]> => {
    const params = new URLSearchParams();
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.type) params.append('type', filters.type);
    const response = await api.get(`/api/activities?${params}`);
    return response.data;
  },

  getTimeline: async (doctorId?: string): Promise<Activity[]> => {
    const params = doctorId ? `?doctorId=${doctorId}` : '';
    const response = await api.get(`/api/activities/timeline${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Activity> => {
    const response = await api.get(`/api/activities/${id}`);
    return response.data;
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/activityService.ts
git commit -m "feat(activity): add activityService with create and list APIs"
```

---

## Task 11: Create Activity Store

**Files:**
- Create: `frontend/src/store/activityStore.ts`

- [ ] **Step 1: Create activityStore.ts**

```typescript
import { create } from 'zustand';
import { activityService, type Activity } from '../services/activityService';

interface ActivityState {
  activities: Activity[];
  selectedDoctorId: string | null;
  isLoading: boolean;
  error: string | null;
  quickAddOpen: boolean;
  setSelectedDoctor: (id: string | null) => void;
  setQuickAddOpen: (open: boolean) => void;
  fetchTimeline: (doctorId?: string) => Promise<void>;
  createActivity: (data: Parameters<typeof activityService.createActivity>[0]) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  selectedDoctorId: null,
  isLoading: false,
  error: null,
  quickAddOpen: false,

  setSelectedDoctor: (id) => set({ selectedDoctorId: id }),

  setQuickAddOpen: (open) => set({ quickAddOpen: open }),

  fetchTimeline: async (doctorId) => {
    set({ isLoading: true, error: null });
    try {
      const activities = await activityService.getTimeline(doctorId);
      set({ activities, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createActivity: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await activityService.createActivity(data);
      const { selectedDoctorId } = get();
      await get().fetchTimeline(selectedDoctorId || undefined);
      set({ quickAddOpen: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/store/activityStore.ts
git commit -m "feat(activity): add activityStore for timeline state"
```

---

## Task 12: Enhance Activities Page with Timeline + Quick Add

**Files:**
- Modify: `frontend/src/pages/Activities.tsx`

- [ ] **Step 1: Read current Activities.tsx**

Read to understand current structure.

- [ ] **Step 2: Replace with enhanced Activities.tsx**

```typescript
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Phone, MessageSquare, Users, Activity as ActivityIcon, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '../store/authStore';
import { doctorService } from '../services/doctorService';

type ActivityType = 'CALL' | 'MESSAGE' | 'MEETING' | 'DEMO' | 'SAMPLE_SENT';

const typeIcons: Record<ActivityType, React.ReactNode> = {
  CALL: <Phone className="w-4 h-4 text-green-600" />,
  MESSAGE: <MessageSquare className="w-4 h-4 text-purple-600" />,
  MEETING: <Users className="w-4 h-4 text-blue-600" />,
  DEMO: <ActivityIcon className="w-4 h-4 text-orange-600" />,
  SAMPLE_SENT: <ActivityIcon className="w-4 h-4 text-gray-600" />,
};

const gpsStatusColors: Record<string, string> = {
  VALID: 'bg-green-100 text-green-700',
  SUSPICIOUS: 'bg-yellow-100 text-yellow-700',
  MISSING: 'bg-gray-100 text-gray-500',
};

const gpsStatusLabels: Record<string, string> = {
  VALID: 'Valid',
  SUSPICIOUS: 'Suspicious',
  MISSING: 'Missing',
};

type GroupedActivities = {
  today: Activity[],
  yesterday: Activity[],
  dates: Record<string, Activity[]>,
};

export function Activities() {
  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get('doctorId');
  const { user } = useAuthStore();
  const {
    activities,
    selectedDoctorId,
    isLoading,
    quickAddOpen,
    setSelectedDoctor,
    setQuickAddOpen,
    fetchTimeline,
    createActivity,
  } = useActivityStore();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'CALL' as ActivityType,
    content: '',
    result: '',
    nextFollowUpAt: '',
    lat: 0,
    lng: 0,
  });

  // Quick Add form state
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    doctorService.getAll().then(setDoctors).catch(console.error);
  }, []);

  useEffect(() => {
    if (doctorIdFromUrl) {
      setSelectedDoctor(doctorIdFromUrl);
    }
  }, [doctorIdFromUrl, setSelectedDoctor]);

  useEffect(() => {
    fetchTimeline(selectedDoctorId || undefined);
  }, [selectedDoctorId, fetchTimeline]);

  const groupedActivities = useMemo((): GroupedActivities => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const result: GroupedActivities = { today: [], yesterday: [], dates: {} };

    activities.forEach(activity => {
      const activityDate = new Date(activity.createdAt);
      activityDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === today.getTime()) {
        result.today.push(activity);
      } else if (activityDate.getTime() === yesterday.getTime()) {
        result.yesterday.push(activity);
      } else {
        const dateKey = activityDate.toISOString().split('T')[0];
        if (!result.dates[dateKey]) result.dates[dateKey] = [];
        result.dates[dateKey].push(activity);
      }
    });

    return result;
  }, [activities]);

  const selectedDoctor = useMemo(() => {
    if (!selectedDoctorId) return null;
    return doctors.find(d => d.id === selectedDoctorId);
  }, [selectedDoctorId, doctors]);

  const handleSubmit = async () => {
    if (!formData.content.trim()) return;
    if (!selectedDoctorId) return;

    setSubmitting(true);
    try {
      await createActivity({
        doctorId: selectedDoctorId,
        type: formData.type,
        content: formData.content,
        result: formData.result || undefined,
        nextFollowUpAt: formData.nextFollowUpAt || undefined,
        lat: formData.lat || undefined,
        lng: formData.lng || undefined,
      });
      setFormData({ type: 'CALL', content: '', result: '', nextFollowUpAt: '', lat: 0, lng: 0 });
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateHeader = (dateKey: string) => {
    return new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Activities</h1>
          {selectedDoctor && (
            <p className="text-slate-500 mt-1">
              Next follow-up: {selectedDoctor.nextFollowUpAt
                ? new Date(selectedDoctor.nextFollowUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Not scheduled'}
            </p>
          )}
        </div>
        <Button onClick={() => setQuickAddOpen(!quickAddOpen)}>
          {quickAddOpen ? 'Cancel' : '+ Add Activity'}
        </Button>
      </div>

      {/* Doctor Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-500">Doctor:</label>
        <Select
          value={selectedDoctorId || ''}
          onChange={(e) => setSelectedDoctor(e.target.value || null)}
          className="w-64"
        >
          <option value="">All Doctors</option>
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
          ))}
        </Select>
      </div>

      {/* Quick Add Form */}
      {quickAddOpen && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <Select
                  value={selectedDoctorId || ''}
                  onChange={(e) => setSelectedDoctor(e.target.value || null)}
                  className="w-full"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                  className="w-full"
                >
                  <option value="CALL">Call</option>
                  <option value="MESSAGE">Message</option>
                  <option value="MEETING">Meeting</option>
                  <option value="DEMO">Demo</option>
                  <option value="SAMPLE_SENT">Sample Sent</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What happened?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                <Select
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  className="w-full"
                >
                  <option value="">Select result</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="follow_up_needed">Follow-up Needed</option>
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up</label>
                <input
                  type="date"
                  value={formData.nextFollowUpAt}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!formData.content.trim() || !selectedDoctorId || submitting}
              >
                {submitting ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {groupedActivities.today.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Today</h2>
              <div className="space-y-3">
                {groupedActivities.today.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    expanded={expandedId === activity.id}
                    onToggle={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedActivities.yesterday.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Yesterday</h2>
              <div className="space-y-3">
                {groupedActivities.yesterday.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    expanded={expandedId === activity.id}
                    onToggle={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other dates */}
          {Object.entries(groupedActivities.dates).map(([dateKey, dateActivities]) => (
            <div key={dateKey}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">{formatDateHeader(dateKey)}</h2>
              <div className="space-y-3">
                {dateActivities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    expanded={expandedId === activity.id}
                    onToggle={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No activities yet. Click "+ Add Activity" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity, expanded, onToggle }: { activity: Activity; expanded: boolean; onToggle: () => void }) {
  const typeKey = activity.type as ActivityType;
  const icon = typeIcons[typeKey] || <ActivityIcon className="w-4 h-4" />;

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={onToggle}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-slate-800">{activity.doctorName}</p>
            <span className="text-sm text-gray-400">{formatTime(activity.createdAt)}</span>
          </div>
          <p className="text-sm text-slate-600 truncate">{activity.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gpsStatusColors[activity.gpsStatus]}`}>
              {activity.gpsStatus === 'VALID' && '✅ '}
              {activity.gpsStatus === 'SUSPICIOUS' && '⚠️ '}
              {gpsStatusLabels[activity.gpsStatus]}
              {activity.distanceMeters && ` (${activity.distanceMeters}m)`}
            </span>
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {activity.result && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Result</p>
                  <p className="text-sm font-medium">{activity.result.replace('_', ' ')}</p>
                </div>
              )}
              {activity.nextFollowUpAt && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Next Follow-up</p>
                  <p className="text-sm">{new Date(activity.nextFollowUpAt).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase">Logged by</p>
                <p className="text-sm">{activity.salesName}</p>
              </div>
            </div>
          )}

          <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Activities.tsx
git commit -m "feat(activity): enhance Activities page with timeline and Quick Add"
```

---

## Task 13: Final Build Verification

- [ ] **Step 1: Build backend**

```bash
cd backend && dotnet build
```
Expected: Build succeeded, 0 Warning(s), 0 Error(s)

- [ ] **Step 2: Build frontend**

```bash
cd frontend && npm run build
```
Expected: Compiles successfully

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete activity tracking MVP"
```

---

## Completion Criteria

- [ ] Activities API creates and lists activities with GPS validation
- [ ] Doctor fields updated on activity create
- [ ] Frontend timeline shows grouped activities (Today/Yesterday/dates)
- [ ] Quick Add form works with < 5 second workflow
- [ ] GPS badge shows correct status (VALID/SUSPICIOUS/MISSING)
- [ ] Doctor filter works in header

---

## Notes

- Hospital must have lat/lng for GPS distance validation to work
- If hospital has no coordinates, GPS check is skipped
- Anti-fake features deferred to v2
