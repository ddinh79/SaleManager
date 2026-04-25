# Follow-up Management MVP - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement core follow-up workflow with Today's Tasks view, temperature tracking, snooze, and auto next_action logic.

**Architecture:** Extend existing Doctor and Activity entities. Auto-update temperature and next_follow_up_at in ActivityService. New TasksController for today's tasks. New TasksPage for frontend.

**Tech Stack:** React 18, TypeScript, TailwindCSS, Zustand, .NET 8, EF Core, SQLite

---

## File Map

### Backend (Create/Modify)
| File | Change |
|------|--------|
| `backend/Entities/Enums.cs` | Add Temperature enum |
| `backend/Entities/Doctor.cs` | Add Temperature field |
| `backend/Services/ActivityService.cs` | Auto-update temperature + next_action |
| `backend/Controllers/TasksController.cs` | New - GET /api/tasks/today |
| `backend/Controllers/DoctorsController.cs` | Add temperature + snooze endpoints |

### Frontend (Create/Modify)
| File | Change |
|------|--------|
| `frontend/src/pages/Tasks.tsx` | New - Tasks page |
| `frontend/src/services/doctorService.ts` | Add temperature/snooze methods |
| `frontend/src/navigation/menuConfig.tsx` | Add Tasks route |

---

## Task 1: Add Temperature Enum

**Files:**
- Modify: `backend/Entities/Enums.cs`

- [ ] **Step 1: Read Enums.cs**

Read the file to see current enum structure.

- [ ] **Step 2: Add Temperature enum**

Add after existing enums:
```csharp
public enum Temperature
{
    HOT,
    WARM,
    COLD
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/Entities/Enums.cs
git commit -m "feat(followup): add Temperature enum"
```

---

## Task 2: Add Temperature to Doctor Entity

**Files:**
- Modify: `backend/Entities/Doctor.cs`

- [ ] **Step 1: Read Doctor.cs**

Read to see current fields.

- [ ] **Step 2: Add Temperature field**

Add after existing fields:
```csharp
public Temperature Temperature { get; set; } = Temperature.WARM;
```

- [ ] **Step 3: Commit**

```bash
git add backend/Entities/Doctor.cs
git commit -m "feat(followup): add Temperature field to Doctor"
```

---

## Task 3: Update ActivityService with Auto Temperature + Next Action

**Files:**
- Modify: `backend/Services/ActivityService.cs`

- [ ] **Step 1: Read ActivityService.cs**

Read to see current CreateAsync method.

- [ ] **Step 2: Add auto temperature update**

In the `CreateAsync` method, after setting doctor fields, add temperature logic:

After:
```csharp
doctor.LastActivityAt = DateTime.UtcNow;
if (request.NextFollowUpAt.HasValue)
{
    doctor.NextFollowUpAt = request.NextFollowUpAt;
}
```

Add:
```csharp
// Auto-update temperature based on result
if (request.Result == "interested")
{
    doctor.Temperature = Temperature.HOT;
}
else if (request.Result == "follow_up_needed")
{
    doctor.Temperature = Temperature.WARM;
}
else
{
    doctor.Temperature = Temperature.COLD;
}

// Auto-set next_follow_up_at based on activity type
if (!request.NextFollowUpAt.HasValue)
{
    if (request.Type == ActivityType.MEETING)
    {
        doctor.NextFollowUpAt = DateTime.UtcNow.AddDays(2);
    }
    else if (request.Type == ActivityType.CALL)
    {
        doctor.NextFollowUpAt = DateTime.UtcNow.AddDays(3);
    }
}
```

- [ ] **Step 3: Verify build**

```bash
cd backend && dotnet build
```

- [ ] **Step 4: Commit**

```bash
git add backend/Services/ActivityService.cs
git commit -m "feat(followup): auto-update temperature and next_action based on activity"
```

---

## Task 4: Create TasksController

**Files:**
- Create: `backend/Controllers/TasksController.cs`

- [ ] **Step 1: Create TasksController.cs**

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IDoctorRepository _doctorRepo;
    private readonly IActivityRepository _activityRepo;

    public TasksController(IDoctorRepository doctorRepo, IActivityRepository activityRepo)
    {
        _doctorRepo = doctorRepo;
        _activityRepo = activityRepo;
    }

    [HttpGet("today")]
    public async Task<ActionResult<List<TaskDto>>> GetTodayTasks()
    {
        var salesId = GetCurrentUserId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        // Get all doctors assigned to this sales (or all if admin)
        List<Doctor> doctors;
        if (role == "Admin")
        {
            doctors = await _doctorRepo.GetAllAsync();
        }
        else
        {
            // For now, get all doctors (can filter by AssignedSalesId in future)
            doctors = await _doctorRepo.GetAllAsync();
        }

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var tasks = new List<TaskDto>();

        foreach (var doctor in doctors)
        {
            if (doctor.NextFollowUpAt.HasValue && doctor.NextFollowUpAt.Value < tomorrow)
            {
                var lastActivity = await _activityRepo.GetByDoctorIdAsync(doctor.Id);
                var latestActivity = lastActivity.FirstOrDefault();

                tasks.Add(new TaskDto
                {
                    DoctorId = doctor.Id,
                    DoctorName = doctor.Name,
                    Temperature = doctor.Temperature.ToString(),
                    LastActivityAt = doctor.LastActivityAt,
                    NextFollowUpAt = doctor.NextFollowUpAt.Value,
                    IsOverdue = doctor.NextFollowUpAt.Value < today,
                    LastActivityType = latestActivity?.Type.ToString()
                });
            }
        }

        // Sort: overdue first, then by next_follow_up_at
        var sorted = tasks
            .OrderByDescending(t => t.IsOverdue)
            .ThenBy(t => t.NextFollowUpAt)
            .ToList();

        return Ok(sorted);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(claim ?? throw new UnauthorizedAccessException());
    }
}

public class TaskDto
{
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Temperature { get; set; } = string.Empty;
    public DateTime? LastActivityAt { get; set; }
    public DateTime NextFollowUpAt { get; set; }
    public bool IsOverdue { get; set; }
    public string? LastActivityType { get; set; }
}
```

- [ ] **Step 3: Verify build**

```bash
cd backend && dotnet build
```

- [ ] **Step 4: Commit**

```bash
git add backend/Controllers/TasksController.cs
git commit -m "feat(followup): add TasksController with today tasks endpoint"
```

---

## Task 5: Add Temperature + Snooze Endpoints to DoctorsController

**Files:**
- Modify: `backend/Controllers/DoctorsController.cs`

- [ ] **Step 1: Read DoctorsController.cs**

Read to see current endpoints.

- [ ] **Step 2: Add Temperature Update Endpoint**

Add after existing endpoints:
```csharp
[HttpPost("{id}/temperature")]
public async Task<ActionResult> UpdateTemperature(Guid id, [FromBody] UpdateTemperatureRequest request)
{
    var doctor = await _doctorRepo.GetByIdAsync(id);
    if (doctor == null) return NotFound();

    if (Enum.TryParse<Temperature>(request.Temperature, true, out var temp))
    {
        doctor.Temperature = temp;
        await _doctorRepo.UpdateAsync(doctor);
        return Ok();
    }

    return BadRequest("Invalid temperature value");
}

[HttpPost("{id}/snooze")]
public async Task<ActionResult> SnoozeTask(Guid id, [FromBody] SnoozeRequest request)
{
    var doctor = await _doctorRepo.GetByIdAsync(id);
    if (doctor == null) return NotFound();

    if (doctor.NextFollowUpAt.HasValue)
    {
        doctor.NextFollowUpAt = doctor.NextFollowUpAt.Value.AddDays(request.Days);
        await _doctorRepo.UpdateAsync(doctor);
        return Ok();
    }

    return BadRequest("No task to snooze");
}
```

- [ ] **Step 3: Add Request DTOs**

Create at top of file or in DTOs folder:
```csharp
public class UpdateTemperatureRequest
{
    public string Temperature { get; set; } = string.Empty;
}

public class SnoozeRequest
{
    public int Days { get; set; }
}
```

- [ ] **Step 4: Verify build**

```bash
cd backend && dotnet build
```

- [ ] **Step 5: Commit**

```bash
git add backend/Controllers/DoctorsController.cs
git commit -m "feat(followup): add temperature and snooze endpoints to DoctorsController"
```

---

## Task 6: Update Database

**Files:**
- Delete and recreate database

- [ ] **Step 1: Delete database**

```bash
rm backend/salesystem.db
```

- [ ] **Step 2: Rebuild backend**

```bash
cd backend && dotnet build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: recreate database with Temperature field"
```

---

## Task 7: Create TasksService (Frontend)

**Files:**
- Create: `frontend/src/services/taskService.ts`

- [ ] **Step 1: Create taskService.ts**

```typescript
import api from './api';

export interface TaskItem {
  doctorId: string;
  doctorName: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  lastActivityAt: string | null;
  nextFollowUpAt: string;
  isOverdue: boolean;
  lastActivityType: string | null;
}

export interface UpdateTemperatureRequest {
  temperature: 'HOT' | 'WARM' | 'COLD';
}

export interface SnoozeRequest {
  days: number;
}

export const taskService = {
  getTodayTasks: async (): Promise<TaskItem[]> => {
    const response = await api.get('/api/tasks/today');
    return response.data;
  },

  updateTemperature: async (doctorId: string, temperature: 'HOT' | 'WARM' | 'COLD'): Promise<void> => {
    await api.post(`/api/doctors/${doctorId}/temperature`, { temperature });
  },

  snooze: async (doctorId: string, days: number): Promise<void> => {
    await api.post(`/api/doctors/${doctorId}/snooze`, { days });
  },
};
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/taskService.ts
git commit -m "feat(followup): add taskService with today tasks API"
```

---

## Task 8: Create TasksPage

**Files:**
- Create: `frontend/src/pages/Tasks.tsx`

- [ ] **Step 1: Create Tasks.tsx**

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { taskService, type TaskItem } from '../services/taskService';
import { Phone, MessageSquare, Users, Activity as ActivityIcon, Clock, ChevronDown } from 'lucide-react';

const temperatureColors: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700',
  WARM: 'bg-yellow-100 text-yellow-700',
  COLD: 'bg-gray-100 text-gray-500',
};

const temperatureEmoji: Record<string, string> = {
  HOT: '🔥',
  WARM: '🌤',
  COLD: '❄️',
};

const activityTypeIcons: Record<string, React.ReactNode> = {
  CALL: <Phone className="w-4 h-4" />,
  MESSAGE: <MessageSquare className="w-4 h-4" />,
  MEETING: <Users className="w-4 h-4" />,
  DEMO: <ActivityIcon className="w-4 h-4" />,
  SAMPLE_SENT: <ActivityIcon className="w-4 h-4" />,
};

export function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [snoozeOpen, setSnoozeOpen] = useState<string | null>(null);
  const [tempOpen, setTempOpen] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await taskService.getTodayTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogActivity = (doctorId: string) => {
    navigate(`/activities?doctorId=${doctorId}`);
  };

  const handleTemperatureChange = async (doctorId: string, temp: 'HOT' | 'WARM' | 'COLD') => {
    try {
      await taskService.updateTemperature(doctorId, temp);
      setTempOpen(null);
      loadTasks();
    } catch (error) {
      console.error('Failed to update temperature:', error);
    }
  };

  const handleSnooze = async (doctorId: string, days: number) => {
    try {
      await taskService.snooze(doctorId, days);
      setSnoozeOpen(null);
      loadTasks();
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLastActivityText = (task: TaskItem) => {
    if (!task.lastActivityAt) return 'No activity yet';
    const days = Math.floor((Date.now() - new Date(task.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Today's Tasks</h1>
        <span className="text-sm text-gray-500">{tasks.length} tasks</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No tasks for today. Enjoy your day!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.doctorId} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xl">{temperatureEmoji[task.temperature]}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{task.doctorName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${temperatureColors[task.temperature]}`}>
                        {task.temperature}
                      </span>
                      {task.isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Last: {task.lastActivityType ? `${task.lastActivityType} ` : ''}{getLastActivityText(task)}
                    </p>
                    <p className="text-sm text-gray-400">
                      Next: {formatDate(task.nextFollowUpAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleLogActivity(task.doctorId)}>
                    Log Activity
                  </Button>

                  {/* Temperature dropdown */}
                  <div className="relative">
                    <Button size="sm" variant="ghost" onClick={() => setTempOpen(tempOpen === task.doctorId ? null : task.doctorId)}>
                      Temp <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                    {tempOpen === task.doctorId && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10">
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleTemperatureChange(task.doctorId, 'HOT')}>🔥 Hot</button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleTemperatureChange(task.doctorId, 'WARM')}>🌤 Warm</button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleTemperatureChange(task.doctorId, 'COLD')}>❄️ Cold</button>
                      </div>
                    )}
                  </div>

                  {/* Snooze dropdown */}
                  <div className="relative">
                    <Button size="sm" variant="ghost" onClick={() => setSnoozeOpen(snoozeOpen === task.doctorId ? null : task.doctorId)}>
                      Snooze <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                    {snoozeOpen === task.doctorId && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10">
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleSnooze(task.doctorId, 1)}>1 day</button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleSnooze(task.doctorId, 3)}>3 days</button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100" onClick={() => handleSnooze(task.doctorId, 7)}>1 week</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Tasks.tsx
git commit -m "feat(followup): add Tasks page with today tasks view"
```

---

## Task 9: Update Menu Config

**Files:**
- Modify: `frontend/src/navigation/menuConfig.tsx`

- [ ] **Step 1: Read menuConfig.tsx**

Read to see current menu structure.

- [ ] **Step 2: Add Tasks menu item**

Add to MAIN section:
```tsx
{ label: 'Tasks', path: '/tasks', icon: <CheckSquare className="w-5 h-5" />, roles: ['Admin', 'SalesManager', 'SalesMember'] },
```

Import CheckSquare from lucide-react.

- [ ] **Step 3: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/navigation/menuConfig.tsx
git commit -m "feat(followup): add Tasks to navigation menu"
```

---

## Task 10: Final Build Verification

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
git commit -m "feat: complete follow-up management MVP"
```

---

## Completion Criteria

- [ ] Temperature enum added to Doctor
- [ ] Activity creation auto-updates temperature based on result
- [ ] Activity creation auto-sets next_follow_up_at for MEETING (+2d) and CALL (+3d)
- [ ] GET /api/tasks/today returns today's overdue/today tasks
- [ ] POST /api/doctors/{id}/temperature updates temperature
- [ ] POST /api/doctors/{id}/snooze delays next_follow_up_at
- [ ] Tasks page shows today's tasks sorted overdue first
- [ ] Temperature badge shows correct color (HOT=red, WARM=yellow, COLD=gray)
- [ ] Snooze dropdown works (1 day, 3 days, 1 week)
- [ ] Temperature change dropdown works
- [ ] Log Activity button navigates to activities with doctor pre-selected
- [ ] Tasks visible in navigation menu

---

## Notes

- Snooze simply adds days to existing next_follow_up_at
- Only doctors with next_follow_up_at set AND <= tomorrow appear in tasks
- New doctors default to WARM temperature
