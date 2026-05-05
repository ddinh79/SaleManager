# Sales Task Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hybrid task system that aggregates Doctor follow-ups and Deal closing tasks into a unified, priority-sorted task list with real-time updates.

**Architecture:** Tasks are computed views (not stored entities). TaskService aggregates from Doctors, Deals, and Activities on-the-fly. SignalR broadcasts task updates.

**Tech Stack:** .NET 8, Entity Framework Core, SignalR, React 18, Zustand, TypeScript, TailwindCSS

---

## File Structure

### Backend - New Files
| File | Purpose |
|------|---------|
| `backend/DTOs/TaskDtos.cs` | TaskItem, TasksResponse, SnoozeRequest DTOs |
| `backend/Services/ITaskService.cs` | ITaskService interface |
| `backend/Services/TaskService.cs` | Task aggregation logic |
| `backend/Services/TaskBackgroundService.cs` | Periodic broadcast of task updates |
| `backend/Hubs/TaskHub.cs` | SignalR hub for task notifications |

### Backend - Modified Files
| File | Changes |
|------|---------|
| `backend/Program.cs:XX-XX` | Register TaskService, TaskHub, map TaskHub route |
| `backend/Controllers/TasksController.cs` | Update existing endpoint, add filter params |

### Frontend - New Files
| File | Purpose |
|------|---------|
| `frontend/src/types/index.ts` | Add Task types |
| `frontend/src/services/taskService.ts` | Update with new endpoints |
| `frontend/src/pages/Tasks.tsx` | Complete rewrite with new UI |
| `frontend/src/hooks/useTasks.ts` | React hook for task state management |

### Frontend - Modified Files
| File | Changes |
|------|---------|
| `frontend/src/App.tsx` | Add Tasks page route |

---

## Backend Implementation

### Task 1: Create TaskDtos.cs

**Files:**
- Create: `backend/DTOs/TaskDtos.cs`

- [ ] **Step 1: Create the DTO file**

```csharp
namespace SalesSystem.DTOs;

public enum TaskType
{
    FOLLOW_UP,
    DEAL_CLOSING,
    DEAL_OVERDUE
}

public enum TaskPriority
{
    HIGH,
    MEDIUM,
    LOW
}

public class TaskItem
{
    public Guid Id { get; set; }
    public TaskType Type { get; set; }
    public TaskPriority Priority { get; set; }
    public int Score { get; set; }

    // Doctor info
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string HospitalName { get; set; } = string.Empty;
    public string Temperature { get; set; } = "WARM";

    // Deal info (nullable for FOLLOW_UP only)
    public Guid? DealId { get; set; }
    public string? DealName { get; set; }
    public decimal? DealValue { get; set; }
    public string? DealStage { get; set; }

    // Timing
    public DateTime DueAt { get; set; }
    public int OverdueDays { get; set; }
    public DateTime? LastActivityAt { get; set; }
}

public class TasksSummary
{
    public int Total { get; set; }
    public int Overdue { get; set; }
    public int ClosingSoon { get; set; }
    public int Today { get; set; }
}

public class TasksResponse
{
    public List<TaskItem> Tasks { get; set; } = new();
    public TasksSummary Summary { get; set; } = new();
}

public class SnoozeRequest
{
    public int Days { get; set; }
}

public enum TaskFilter
{
    ALL,
    OVERDUE,
    CLOSING_SOON,
    TODAY
}
```

### Task 2: Create ITaskService.cs

**Files:**
- Create: `backend/Services/ITaskService.cs`

- [ ] **Step 1: Create the interface**

```csharp
using SalesSystem.DTOs;

namespace SalesSystem.Services;

public interface ITaskService
{
    Task<TasksResponse> GetTasksAsync(Guid userId, TaskFilter filter = TaskFilter.ALL);
    Task<bool> SnoozeTaskAsync(Guid taskId, string taskType, int days);
    Task<bool> CompleteTaskAsync(Guid taskId, string taskType);
}
```

### Task 3: Create TaskService.cs

**Files:**
- Create: `backend/Services/TaskService.cs`

- [ ] **Step 1: Implement the task aggregation service**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IDealRepository _dealRepo;
    private readonly IActivityRepository _activityRepo;

    public TaskService(
        AppDbContext context,
        IDoctorRepository doctorRepo,
        IDealRepository dealRepo,
        IActivityRepository activityRepo)
    {
        _context = context;
        _doctorRepo = doctorRepo;
        _dealRepo = dealRepo;
        _activityRepo = activityRepo;
    }

    public async Task<TasksResponse> GetTasksAsync(Guid userId, TaskFilter filter = TaskFilter.ALL)
    {
        var tasks = new List<TaskItem>();
        var now = DateTime.UtcNow;

        // 1. FOLLOW_UP tasks from Doctors
        var doctors = await _doctorRepo.GetByAssignedSalesIdAsync(userId);
        foreach (var doctor in doctors)
        {
            if (doctor.NextFollowUpAt.HasValue && doctor.NextFollowUpAt.Value <= now.AddDays(1))
            {
                var overdueDays = (int)(now - doctor.NextFollowUpAt.Value).TotalDays;
                tasks.Add(new TaskItem
                {
                    Id = doctor.Id,
                    Type = overdueDays > 0 ? TaskType.DEAL_OVERDUE : TaskType.FOLLOW_UP,
                    Priority = overdueDays > 0 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
                    Score = overdueDays > 0 ? 100 : 85,
                    DoctorId = doctor.Id,
                    DoctorName = doctor.Name,
                    HospitalName = doctor.Hospital?.Name ?? "",
                    Temperature = doctor.Temperature.ToString(),
                    DueAt = doctor.NextFollowUpAt.Value,
                    OverdueDays = overdueDays,
                    LastActivityAt = doctor.LastActivityAt
                });
            }
        }

        // 2. DEAL tasks from Deals
        var deals = await _dealRepo.GetBySalesIdAsync(userId, 1000, 0);
        var fiveDaysAgo = now.AddDays(-5);

        foreach (var deal in deals)
        {
            if (deal.Stage == DealStage.WON || deal.Stage == DealStage.LOST)
                continue;

            var overdueDays = (int)(now - deal.ExpectedCloseDate).TotalDays;
            var isOverdue = overdueDays > 0;
            var closeWithin1Day = deal.ExpectedCloseDate <= now.AddDays(1);
            var closeWithin3Days = deal.ExpectedCloseDate <= now.AddDays(3);

            if (filter == TaskFilter.OVERDUE && !isOverdue) continue;
            if (filter == TaskFilter.CLOSING_SOON && !closeWithin3Days) continue;
            if (filter == TaskFilter.TODAY && (isOverdue || !closeWithin1Day)) continue;

            // Skip if not closing soon and filter is CLOSING_SOON
            if (filter == TaskFilter.CLOSING_SOON && !closeWithin3Days && !isOverdue) continue;

            // Calculate priority score
            int baseScore = isOverdue ? 100 : (closeWithin1Day ? 95 : (closeWithin3Days ? 85 : 0));
            int bonus = deal.Stage == DealStage.NEGOTIATION ? 5 : 0;
            if (deal.UpdatedAt < fiveDaysAgo) bonus += 10;

            var task = new TaskItem
            {
                Id = deal.Id,
                Type = isOverdue ? TaskType.DEAL_OVERDUE : TaskType.DEAL_CLOSING,
                DoctorId = deal.DoctorId,
                DoctorName = deal.Doctor?.Name ?? "",
                HospitalName = deal.Doctor?.Hospital?.Name ?? "",
                Temperature = deal.Doctor?.Temperature.ToString() ?? "WARM",
                DealId = deal.Id,
                DealName = deal.Doctor?.Name ?? "",
                DealValue = deal.TotalValue,
                DealStage = deal.Stage.ToString(),
                DueAt = deal.ExpectedCloseDate,
                OverdueDays = overdueDays,
                LastActivityAt = deal.UpdatedAt,
                Score = baseScore + bonus,
                Priority = isOverdue ? TaskPriority.HIGH : (closeWithin1Day ? TaskPriority.HIGH : TaskPriority.MEDIUM)
            };

            // Override priority based on score
            if (task.Score >= 100) task.Priority = TaskPriority.HIGH;
            else if (task.Score >= 90) task.Priority = TaskPriority.HIGH;
            else if (task.Score >= 80) task.Priority = TaskPriority.MEDIUM;
            else task.Priority = TaskPriority.LOW;

            tasks.Add(task);
        }

        // Sort by priority score DESC
        var sortedTasks = tasks.OrderByDescending(t => t.Score).ToList();

        // Calculate summary
        var summary = new TasksSummary
        {
            Total = sortedTasks.Count,
            Overdue = sortedTasks.Count(t => t.Type == TaskType.DEAL_OVERDUE || t.OverdueDays > 0),
            ClosingSoon = sortedTasks.Count(t => t.Type == TaskType.DEAL_CLOSING && t.OverdueDays <= 0),
            Today = sortedTasks.Count(t => t.DueAt <= now.AddDays(1))
        };

        return new TasksResponse { Tasks = sortedTasks, Summary = summary };
    }

    public async Task<bool> SnoozeTaskAsync(Guid taskId, string taskType, int days)
    {
        var futureDate = DateTime.UtcNow.AddDays(days);

        if (taskType == "FOLLOW_UP" || taskType == "DEAL_OVERDUE")
        {
            var doctor = await _doctorRepo.GetByIdAsync(taskId);
            if (doctor == null) return false;
            doctor.NextFollowUpAt = futureDate;
            await _doctorRepo.UpdateAsync(doctor);
            return true;
        }

        // For deal tasks, update the deal's expected close date isn't right
        // Instead we need a separate mechanism or just update doctor
        return false;
    }

    public async Task<bool> CompleteTaskAsync(Guid taskId, string taskType)
    {
        if (taskType == "FOLLOW_UP" || taskType == "DEAL_OVERDUE")
        {
            var doctor = await _doctorRepo.GetByIdAsync(taskId);
            if (doctor == null) return false;
            doctor.NextFollowUpAt = DateTime.UtcNow.AddDays(1);
            await _doctorRepo.UpdateAsync(doctor);
            return true;
        }
        return false;
    }
}
```

### Task 4: Create TaskHub.cs

**Files:**
- Create: `backend/Hubs/TaskHub.cs`

- [ ] **Step 1: Create the SignalR hub**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Hubs;

[Authorize]
public class TaskHub : Hub
{
    public async Task JoinUserGroup(Guid userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Tasks_User_{userId}");
    }

    public async Task LeaveUserGroup(Guid userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Tasks_User_{userId}");
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

### Task 5: Update TasksController.cs

**Files:**
- Modify: `backend/Controllers/TasksController.cs`

- [ ] **Step 1: Update the controller**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs;
using SalesSystem.Helpers;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<TasksResponse>> GetTasks(
        [FromQuery] TaskFilter filter = TaskFilter.ALL)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized();

        var result = await _taskService.GetTasksAsync(userId.Value, filter);
        return Ok(result);
    }

    [HttpPost("{taskId}/snooze")]
    public async Task<ActionResult> SnoozeTask(
        Guid taskId,
        [FromBody] SnoozeRequest request)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized();

        // Determine task type from query or body
        var taskType = Request.Query["type"].ToString() ?? "FOLLOW_UP";
        var success = await _taskService.SnoozeTaskAsync(taskId, taskType, request.Days);
        if (!success)
            return NotFound();

        return Ok();
    }

    [HttpPost("{taskId}/complete")]
    public async Task<ActionResult> CompleteTask(Guid taskId)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized();

        var taskType = Request.Query["type"].ToString() ?? "FOLLOW_UP";
        var success = await _taskService.CompleteTaskAsync(taskId, taskType);
        if (!success)
            return NotFound();

        return Ok();
    }
}
```

### Task 6: Register TaskService in Program.cs

**Files:**
- Modify: `backend/Program.cs`

- [ ] **Step 1: Add service registration and hub mapping**

Find the section after `builder.Services.AddScoped<IDashboardService, DashboardService>();` and add:

```csharp
builder.Services.AddScoped<ITaskService, TaskService>();
```

Find `app.MapHub<NotificationHub>("/hubs/notifications");` and add after:

```csharp
app.MapHub<TaskHub>("/hubs/tasks");
```

---

## Frontend Implementation

### Task 7: Add Task Types to index.ts

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add Task types**

Find the Deal types section and add after:

```typescript
export type TaskType = 'FOLLOW_UP' | 'DEAL_CLOSING' | 'DEAL_OVERDUE';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskItem {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  score: number;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  dealId?: string;
  dealName?: string;
  dealValue?: number;
  dealStage?: DealStage;
  dueAt: string;
  overdueDays: number;
  lastActivityAt?: string;
}

export interface TasksSummary {
  total: number;
  overdue: number;
  closingSoon: number;
  today: number;
}

export interface TasksResponse {
  tasks: TaskItem[];
  summary: TasksSummary;
}

export type TaskFilter = 'ALL' | 'OVERDUE' | 'CLOSING_SOON' | 'TODAY';
```

### Task 8: Update taskService.ts

**Files:**
- Modify: `frontend/src/services/taskService.ts`

- [ ] **Step 1: Update the service**

```typescript
import api from './api';
import { TaskItem, TasksResponse, TaskFilter } from '../types';

export const taskService = {
  getTasks: async (filter?: TaskFilter): Promise<TasksResponse> => {
    const params = filter && filter !== 'ALL' ? { filter } : {};
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  snoozeTask: async (taskId: string, taskType: string, days: number): Promise<void> => {
    await api.post(`/tasks/${taskId}/snooze?type=${taskType}`, { days });
  },

  completeTask: async (taskId: string, taskType: string): Promise<void> => {
    await api.post(`/tasks/${taskId}/complete?type=${taskType}`);
  },
};
```

### Task 9: Create useTasks.ts hook

**Files:**
- Create: `frontend/src/hooks/useTasks.ts`

- [ ] **Step 1: Create the Zustand-like hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { TaskItem, TasksResponse, TaskFilter } from '../types';

export function useTasks(initialFilter: TaskFilter = 'ALL') {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState<TasksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskService.getTasks(filter);
      setTasks(response.tasks);
      setSummary(response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const snooze = useCallback(async (taskId: string, taskType: string, days: number) => {
    await taskService.snoozeTask(taskId, taskType, days);
    await loadTasks();
  }, [loadTasks]);

  const complete = useCallback(async (taskId: string, taskType: string) => {
    await taskService.completeTask(taskId, taskType);
    await loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    summary,
    loading,
    error,
    filter,
    setFilter,
    snooze,
    complete,
    refresh: loadTasks,
  };
}
```

### Task 10: Rewrite Tasks.tsx

**Files:**
- Modify: `frontend/src/pages/Tasks.tsx`

- [ ] **Step 1: Rewrite the Tasks page with new UI**

```tsx
import { useTasks } from '../hooks/useTasks';
import { TaskItem, TaskFilter } from '../types';
import { Phone, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const filterTabs: { value: TaskFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OVERDUE', label: 'Quá hạn' },
  { value: 'CLOSING_SOON', label: 'Sắp đóng' },
  { value: 'TODAY', label: 'Hôm nay' },
];

function getTaskColor(task: TaskItem): string {
  if (task.overdueDays > 0) return 'border-l-red-500 bg-red-50';
  if (task.type === 'DEAL_CLOSING') {
    if (task.overdueDays >= -1) return 'border-l-orange-500 bg-orange-50';
    return 'border-l-yellow-500 bg-yellow-50';
  }
  return 'border-l-blue-500 bg-white';
}

function getTaskIcon(task: TaskItem) {
  if (task.overdueDays > 0) return <AlertCircle className="w-5 h-5 text-red-500" />;
  if (task.type === 'DEAL_CLOSING') return <Clock className="w-5 h-5 text-orange-500" />;
  return <CheckCircle className="w-5 h-5 text-blue-500" />;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function TaskCard({ task, onSnooze, onComplete }: { task: TaskItem; onSnooze: (days: number) => void; onComplete: () => void }) {
  return (
    <div className={`border-l-4 ${getTaskColor(task)} rounded-lg shadow-sm p-4 mb-3`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getTaskIcon(task)}
            <h3 className="font-semibold text-slate-800">{task.doctorName}</h3>
          </div>
          <p className="text-sm text-slate-500">{task.hospitalName}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              task.overdueDays > 0 ? 'bg-red-100 text-red-700' :
              task.type === 'DEAL_CLOSING' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {task.type === 'DEAL_OVERDUE' && `Quá hạn ${task.overdueDays} ngày`}
              {task.type === 'DEAL_CLOSING' && (task.overdueDays >= 0 ? `Đóng trong ${task.overdueDays} ngày` : `Đóng trong ${Math.abs(task.overdueDays)} ngày`)}
              {task.type === 'FOLLOW_UP' && 'Follow-up hôm nay'}
            </span>

            {task.dealValue && (
              <span className="text-xs font-medium text-slate-600">
                💰 {formatCurrency(task.dealValue)}
              </span>
            )}
            {task.dealStage && (
              <span className="text-xs text-slate-500">
                {task.dealStage}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onComplete()}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
            title="Hoàn thành"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
          <div className="relative group">
            <button
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Tạm hoãn"
            >
              <Clock className="w-5 h-5" />
            </button>
            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border p-2 z-10 min-w-[120px]">
              <button onClick={() => onSnooze(1)} className="block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded">1 ngày</button>
              <button onClick={() => onSnooze(3)} className="block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded">3 ngày</button>
              <button onClick={() => onSnooze(7)} className="block w-full text-left px-3 py-1 text-sm hover:bg-slate-100 rounded">7 ngày</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Tasks: React.FC = () => {
  const { tasks, summary, loading, error, filter, setFilter, snooze, complete } = useTasks();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="text-slate-500">Đang tải...</span></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64"><span className="text-red-500">{error}</span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Công việc</h1>
          <p className="text-slate-500">Danh sách công việc ưu tiên</p>
        </div>
        {summary && (
          <div className="flex gap-4 text-sm">
            <span className="text-red-600">⚠️ {summary.overdue} quá hạn</span>
            <span className="text-orange-600">⏰ {summary.closingSoon} sắp đóng</span>
            <span className="text-blue-600">📋 {summary.total} tổng cộng</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Không có công việc nào
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={`${task.type}-${task.id}`}
              task={task}
              onSnooze={(days) => snooze(task.id, task.type, days)}
              onComplete={() => complete(task.id, task.type)}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

### Task 11: Add Tasks route to App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add Tasks import and route**

Find the imports section and add `Tasks` to the lazy imports:

```tsx
const Tasks = lazy(() => import('./pages/Tasks'));
```

Find the Routes section and add:

```tsx
<Route path="/tasks" element={<Tasks />} />
```

---

## Verification

### Backend Build
```bash
cd backend && dotnet build
# Expected: Build succeeded. 0 Warning(s) 0 Error(s)
```

### Frontend Build
```bash
cd frontend && npm run build 2>&1 | Select-Object -Last 10
# Expected: No TypeScript errors
```

### Manual Test
1. Login as admin/manager/sales
2. Navigate to /tasks
3. Verify tasks load with correct color coding
4. Test snooze and complete actions
5. Verify SignalR connection (check browser console for hub connection)
