# User Management + KPI Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement user management with role-based permissions, team hierarchy, KPI tracking, and dashboard features for Sales Management System.

**Architecture:** Backend adds AvatarUrl field and new KPI aggregation service. Frontend adds user management UI with list/detail pages, role badges, and performance indicators. Follows existing layered architecture (Controller → Service → Repository) and React component patterns.

**Tech Stack:** ASP.NET Core 8, Entity Framework Core SQLite, React 18, TypeScript, Zustand, TailwindCSS

---

## File Map

### Backend (New Files)
| File | Responsibility |
|------|----------------|
| `backend/DTOs/Response/UserDetailResponse.cs` | Extended user response with KPI data |
| `backend/DTOs/Response/KpiSummaryResponse.cs` | Daily/Weekly/Monthly KPI aggregation |
| `backend/DTOs/Request/UpdateUserAvatarRequest.cs` | Avatar update request |
| `backend/Services/IKpiService.cs` | KPI calculation interface |
| `backend/Services/KpiService.cs` | KPI aggregation implementation |
| `backend/Controllers/KpiController.cs` | KPI API endpoints |

### Backend (Modified Files)
| File | Change |
|------|--------|
| `backend/Entities/User.cs` | Add AvatarUrl property |
| `backend/DTOs/Response/UserResponse.cs` | Add AvatarUrl field |
| `backend/DTOs/Request/RegisterRequest.cs` | Add AvatarUrl field |
| `backend/DTOs/Request/UpdateUserRequest.cs` | Add AvatarUrl field |
| `backend/Services/UserService.cs` | Handle AvatarUrl in create/update |

### Frontend (New Files)
| File | Responsibility |
|------|----------------|
| `frontend/src/services/userService.ts` | User API calls |
| `frontend/src/pages/Users.tsx` | User list with search/filter |
| `frontend/src/pages/UserDetail.tsx` | User profile + KPI tabs |
| `frontend/src/components/common/RoleBadge.tsx` | Role-colored badge component |
| `frontend/src/components/common/PerformanceCard.tsx` | KPI metric display card |
| `frontend/src/types/kpi.ts` | KPI TypeScript interfaces |

### Frontend (Modified Files)
| File | Change |
|------|--------|
| `frontend/src/components/common/Sidebar.tsx` | Add Users navigation |
| `frontend/src/components/common/TopBar.tsx` | Add avatar display |
| `frontend/src/App.tsx` | Add /users and /users/:id routes |
| `frontend/src/types/index.ts` | Extend User interface with AvatarUrl |

---

## Backend Tasks

### Task 1: Add AvatarUrl to User Entity

**Files:**
- Modify: `backend/Entities/User.cs`
- Modify: `backend/DTOs/Response/UserResponse.cs`
- Modify: `backend/DTOs/Request/RegisterRequest.cs`
- Modify: `backend/DTOs/Request/UpdateUserRequest.cs`

- [ ] **Step 1: Add AvatarUrl property to User.cs**

Find line after `public string? Email { get; set; }` and add:

```csharp
public string? AvatarUrl { get; set; }
```

- [ ] **Step 2: Add AvatarUrl to UserResponse.cs**

Find existing properties and add after `public string? ManagerName { get; set; }`:

```csharp
public string? AvatarUrl { get; set; }
```

- [ ] **Step 3: Add AvatarUrl to RegisterRequest.cs**

Find existing properties and add:

```csharp
public string? AvatarUrl { get; set; }
```

- [ ] **Step 4: Add AvatarUrl to UpdateUserRequest.cs**

Find existing properties and add:

```csharp
public string? AvatarUrl { get; set; }
```

- [ ] **Step 5: Update UserService.RegisterAsync to set AvatarUrl**

Find in RegisterAsync method where new User is created:

```csharp
var user = new User
{
    // ... existing fields ...
    // AvatarUrl = request.AvatarUrl,  // ADD THIS LINE
};
```

- [ ] **Step 6: Update UserService.UpdateUserAsync to handle AvatarUrl**

Find the update logic and ensure AvatarUrl is mapped if provided.

- [ ] **Step 7: Verify build succeeds**

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

### Task 2: Create KPI DTOs

**Files:**
- Create: `backend/DTOs/Response/KpiSummaryResponse.cs`
- Create: `backend/DTOs/Response/UserDetailResponse.cs`
- Create: `backend/DTOs/Request/UpdateUserAvatarRequest.cs`

- [ ] **Step 1: Create KpiSummaryResponse.cs**

```csharp
namespace SalesSystem.DTOs.Response;

public class KpiSummaryResponse
{
    public int TotalCalls { get; set; }
    public int TotalMeetings { get; set; }
    public int TotalDeals { get; set; }
    public int WonDeals { get; set; }
    public int LostDeals { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal ConversionRate { get; set; }
    public int ActivityScore { get; set; }
}

public class DailyKpiResponse
{
    public DateTime Date { get; set; }
    public int Calls { get; set; }
    public int Meetings { get; set; }
    public int NewDeals { get; set; }
    public decimal Revenue { get; set; }
}

public class WeeklyKpiResponse
{
    public int WeekNumber { get; set; }
    public int Calls { get; set; }
    public int Meetings { get; set; }
    public int WonDeals { get; set; }
    public decimal ConversionRate { get; set; }
}

public class MonthlyKpiResponse
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Revenue { get; set; }
    public decimal TargetPercent { get; set; }
    public decimal AvgDealSize { get; set; }
}
```

- [ ] **Step 2: Create UserDetailResponse.cs**

```csharp
namespace SalesSystem.DTOs.Response;

public class UserDetailResponse : UserResponse
{
    public List<DoctorDto> AssignedDoctors { get; set; } = new();
    public KpiSummaryResponse Kpi { get; set; } = new();
    public int TotalDeals { get; set; }
    public int ActiveDeals { get; set; }
    public int TotalActivities { get; set; }
}
```

- [ ] **Step 3: Create UpdateUserAvatarRequest.cs**

```csharp
namespace SalesSystem.DTOs.Request;

public class UpdateUserAvatarRequest
{
    public string AvatarUrl { get; set; }
}
```

- [ ] **Step 4: Verify build succeeds**

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

### Task 3: Create KPI Service

**Files:**
- Create: `backend/Services/IKpiService.cs`
- Create: `backend/Services/KpiService.cs`

- [ ] **Step 1: Create IKpiService.cs**

```csharp
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IKpiService
{
    Task<KpiSummaryResponse> GetUserKpiSummaryAsync(Guid userId);
    Task<List<DailyKpiResponse>> GetDailyKpiAsync(Guid userId, DateTime from, DateTime to);
    Task<List<WeeklyKpiResponse>> GetWeeklyKpiAsync(Guid userId, int year);
    Task<List<MonthlyKpiResponse>> GetMonthlyKpiAsync(Guid userId, int year);
    Task<decimal> GetTotalRevenueAsync(Guid userId, DateTime from, DateTime to);
    Task<int> GetTotalCallsAsync(Guid userId, DateTime from, DateTime to);
    Task<int> GetTotalMeetingsAsync(Guid userId, DateTime from, DateTime to);
}
```

- [ ] **Step 2: Create KpiService.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public class KpiService : IKpiService
{
    private readonly AppDbContext _context;

    public KpiService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<KpiSummaryResponse> GetUserKpiSummaryAsync(Guid userId)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var activities = await _context.Activities
            .Where(a => a.SalesId == userId && a.CreatedAt >= thirtyDaysAgo)
            .ToListAsync();

        var deals = await _context.Deals
            .Where(d => d.SalesId == userId)
            .ToListAsync();

        var orders = await _context.Orders
            .Include(o => o.Deal)
            .Where(o => o.Deal!.SalesId == userId && o.Status == OrderStatus.Completed)
            .ToListAsync();

        var totalCalls = activities.Count(a => a.Type == ActivityType.CALL);
        var totalMeetings = activities.Count(a => a.Type == ActivityType.MEETING);
        var wonDeals = deals.Count(d => d.Stage == DealStage.WON);
        var lostDeals = deals.Count(d => d.Stage == DealStage.LOST);
        var totalDeals = deals.Count;
        var totalRevenue = orders.Sum(o => o.TotalValue);

        var conversionRate = totalDeals > 0 ? (decimal)wonDeals / totalDeals * 100 : 0;
        var activityScore = (totalCalls * 1) + (totalMeetings * 3) + (wonDeals * 5);

        return new KpiSummaryResponse
        {
            TotalCalls = totalCalls,
            TotalMeetings = totalMeetings,
            TotalDeals = totalDeals,
            WonDeals = wonDeals,
            LostDeals = lostDeals,
            TotalRevenue = totalRevenue,
            ConversionRate = Math.Round(conversionRate, 2),
            ActivityScore = activityScore
        };
    }

    public async Task<List<DailyKpiResponse>> GetDailyKpiAsync(Guid userId, DateTime from, DateTime to)
    {
        var activities = await _context.Activities
            .Where(a => a.SalesId == userId && a.CreatedAt >= from && a.CreatedAt <= to)
            .ToListAsync();

        var deals = await _context.Deals
            .Where(d => d.SalesId == userId && d.CreatedAt >= from && d.CreatedAt <= to)
            .ToListAsync();

        var orders = await _context.Orders
            .Include(o => o.Deal)
            .Where(o => o.Deal!.SalesId == userId && o.Status == OrderStatus.Completed && o.CreatedAt >= from && o.CreatedAt <= to)
            .ToListAsync();

        var result = new List<DailyKpiResponse>();
        for (var date = from.Date; date <= to.Date; date = date.AddDays(1))
        {
            var dayActivities = activities.Where(a => a.CreatedAt.Date == date);
            var dayDeals = deals.Where(d => d.CreatedAt.Date == date);
            var dayOrders = orders.Where(o => o.CreatedAt.Date == date);

            result.Add(new DailyKpiResponse
            {
                Date = date,
                Calls = dayActivities.Count(a => a.Type == ActivityType.CALL),
                Meetings = dayActivities.Count(a => a.Type == ActivityType.MEETING),
                NewDeals = dayDeals.Count(),
                Revenue = dayOrders.Sum(o => o.TotalValue)
            });
        }

        return result;
    }

    public async Task<List<WeeklyKpiResponse>> GetWeeklyKpiAsync(Guid userId, int year)
    {
        var startOfYear = new DateTime(year, 1, 1);
        var endOfYear = new DateTime(year, 12, 31);

        var activities = await _context.Activities
            .Where(a => a.SalesId == userId && a.CreatedAt >= startOfYear && a.CreatedAt <= endOfYear)
            .ToListAsync();

        var deals = await _context.Deals
            .Where(d => d.SalesId == userId && d.CreatedAt >= startOfYear && d.CreatedAt <= endOfYear)
            .ToListAsync();

        var result = new List<WeeklyKpiResponse>();
        for (int week = 1; week <= 52; week++)
        {
            var weekStart = GetStartOfWeek(year, week);
            var weekEnd = weekStart.AddDays(6);

            var weekActivities = activities.Where(a => a.CreatedAt >= weekStart && a.CreatedAt <= weekEnd);
            var weekDeals = deals.Where(d => d.CreatedAt >= weekStart && d.CreatedAt <= weekEnd);
            var wonDeals = weekDeals.Count(d => d.Stage == DealStage.WON);
            var totalDeals = weekDeals.Count();

            result.Add(new WeeklyKpiResponse
            {
                WeekNumber = week,
                Calls = weekActivities.Count(a => a.Type == ActivityType.CALL),
                Meetings = weekActivities.Count(a => a.Type == ActivityType.MEETING),
                WonDeals = wonDeals,
                ConversionRate = totalDeals > 0 ? Math.Round((decimal)wonDeals / totalDeals * 100, 2) : 0
            });
        }

        return result;
    }

    public async Task<List<MonthlyKpiResponse>> GetMonthlyKpiAsync(Guid userId, int year)
    {
        var startOfYear = new DateTime(year, 1, 1);
        var endOfYear = new DateTime(year, 12, 31);

        var orders = await _context.Orders
            .Include(o => o.Deal)
            .Where(o => o.Deal!.SalesId == userId && o.Status == OrderStatus.Completed && o.CreatedAt >= startOfYear && o.CreatedAt <= endOfYear)
            .ToListAsync();

        var deals = await _context.Deals
            .Where(d => d.SalesId == userId && d.CreatedAt >= startOfYear && d.CreatedAt <= endOfYear)
            .ToListAsync();

        var result = new List<MonthlyKpiResponse>();
        for (int month = 1; month <= 12; month++)
        {
            var monthOrders = orders.Where(o => o.CreatedAt.Month == month);
            var monthDeals = deals.Where(d => d.CreatedAt.Month == month && d.Stage == DealStage.WON);
            var wonDeals = monthDeals.Count();

            result.Add(new MonthlyKpiResponse
            {
                Month = month,
                Year = year,
                Revenue = monthOrders.Sum(o => o.TotalValue),
                TargetPercent = 0, // No target system yet
                AvgDealSize = wonDeals > 0 ? monthOrders.Sum(o => o.TotalValue) / wonDeals : 0
            });
        }

        return result;
    }

    public async Task<decimal> GetTotalRevenueAsync(Guid userId, DateTime from, DateTime to)
    {
        return await _context.Orders
            .Include(o => o.Deal)
            .Where(o => o.Deal!.SalesId == userId && o.Status == OrderStatus.Completed && o.CreatedAt >= from && o.CreatedAt <= to)
            .SumAsync(o => o.TotalValue);
    }

    public async Task<int> GetTotalCallsAsync(Guid userId, DateTime from, DateTime to)
    {
        return await _context.Activities
            .CountAsync(a => a.SalesId == userId && a.Type == ActivityType.CALL && a.CreatedAt >= from && a.CreatedAt <= to);
    }

    public async Task<int> GetTotalMeetingsAsync(Guid userId, DateTime from, DateTime to)
    {
        return await _context.Activities
            .CountAsync(a => a.SalesId == userId && a.Type == ActivityType.MEETING && a.CreatedAt >= from && a.CreatedAt <= to);
    }

    private DateTime GetStartOfWeek(int year, int week)
    {
        var jan1 = new DateTime(year, 1, 1);
        var daysOffset = (DayOfWeek.Monday - jan1.DayOfWeek);
        var firstMonday = daysOffset >= 0 ? jan1.AddDays(daysOffset) : jan1.AddDays(7 + daysOffset);
        return firstMonday.AddDays((week - 1) * 7);
    }
}
```

- [ ] **Step 3: Register KpiService in Program.cs**

Find the service registration section and add:

```csharp
builder.Services.AddScoped<IKpiService, KpiService>();
```

- [ ] **Step 4: Verify build succeeds**

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

### Task 4: Create KPI Controller

**Files:**
- Create: `backend/Controllers/KpiController.cs`

- [ ] **Step 1: Create KpiController.cs**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Response;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KpiController : ControllerBase
{
    private readonly IKpiService _kpiService;

    public KpiController(IKpiService kpiService)
    {
        _kpiService = kpiService;
    }

    [HttpGet("users/{userId}/summary")]
    public async Task<ActionResult<KpiSummaryResponse>> GetUserKpiSummary(Guid userId)
    {
        var kpi = await _kpiService.GetUserKpiSummaryAsync(userId);
        return Ok(kpi);
    }

    [HttpGet("users/{userId}/daily")]
    public async Task<ActionResult<List<DailyKpiResponse>>> GetDailyKpi(Guid userId, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;
        var kpi = await _kpiService.GetDailyKpiAsync(userId, fromDate, toDate);
        return Ok(kpi);
    }

    [HttpGet("users/{userId}/weekly")]
    public async Task<ActionResult<List<WeeklyKpiResponse>>> GetWeeklyKpi(Guid userId, [FromQuery] int? year = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var kpi = await _kpiService.GetWeeklyKpiAsync(userId, targetYear);
        return Ok(kpi);
    }

    [HttpGet("users/{userId}/monthly")]
    public async Task<ActionResult<List<MonthlyKpiResponse>>> GetMonthlyKpi(Guid userId, [FromQuery] int? year = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var kpi = await _kpiService.GetMonthlyKpiAsync(userId, targetYear);
        return Ok(kpi);
    }

    [HttpGet("users/{userId}/revenue")]
    public async Task<ActionResult<decimal>> GetRevenue(Guid userId, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;
        var revenue = await _kpiService.GetTotalRevenueAsync(userId, fromDate, toDate);
        return Ok(revenue);
    }
}
```

- [ ] **Step 2: Verify build succeeds**

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

### Task 5: Extend UserResponse with AvatarUrl (Already done in Task 1)

This task is already covered in Task 1. Verify the UserResponse includes AvatarUrl.

- [ ] **Step 1: Verify UserResponse.cs has AvatarUrl**

Check that UserResponse includes:
```csharp
public string? AvatarUrl { get; set; }
```

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

## Frontend Tasks

### Task 6: Create User Service

**Files:**
- Create: `frontend/src/services/userService.ts`

- [ ] **Step 1: Create userService.ts**

```typescript
import api from './api';
import { User, UserRole } from '../types';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  managerId?: string;
  avatarUrl?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  managerId?: string;
  avatarUrl?: string;
}

export interface UserFilters {
  role?: UserRole;
  managerId?: string;
  status?: 'active' | 'inactive';
}

export const userService = {
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.managerId) params.append('managerId', filters.managerId);
    if (filters?.status) params.append('status', filters.status);
    const response = await api.get<User[]>(`/users?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  getSalesMembers: async (managerId?: string): Promise<User[]> => {
    const params = managerId ? `?managerId=${managerId}` : '';
    const response = await api.get<User[]>(`/users/sales-members${params}`);
    return response.data;
  },

  getManagers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/managers');
    return response.data;
  },

  getTeam: async (managerId: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/users/${managerId}/team`);
    return response.data;
  },

  updateAvatar: async (id: string, avatarUrl: string): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/avatar`, { avatarUrl });
    return response.data;
  },
};
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 7: Create KPI Types

**Files:**
- Create: `frontend/src/types/kpi.ts`

- [ ] **Step 1: Create kpi.ts**

```typescript
export interface KpiSummary {
  totalCalls: number;
  totalMeetings: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  conversionRate: number;
  activityScore: number;
}

export interface DailyKpi {
  date: string;
  calls: number;
  meetings: number;
  newDeals: number;
  revenue: number;
}

export interface WeeklyKpi {
  weekNumber: number;
  calls: number;
  meetings: number;
  wonDeals: number;
  conversionRate: number;
}

export interface MonthlyKpi {
  month: number;
  year: number;
  revenue: number;
  targetPercent: number;
  avgDealSize: number;
}

export type PerformanceLevel = 'excellent' | 'average' | 'poor';

export const getPerformanceLevel = (conversionRate: number): PerformanceLevel => {
  if (conversionRate >= 50) return 'excellent';
  if (conversionRate >= 25) return 'average';
  return 'poor';
};

export const getPerformanceColor = (level: PerformanceLevel): string => {
  switch (level) {
    case 'excellent': return 'text-green-600 bg-green-50';
    case 'average': return 'text-yellow-600 bg-yellow-50';
    case 'poor': return 'text-red-600 bg-red-50';
  }
};
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 8: Create RoleBadge Component

**Files:**
- Create: `frontend/src/components/common/RoleBadge.tsx`

- [ ] **Step 1: Create RoleBadge.tsx**

```typescript
import { UserRole } from '../types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

const roleStyles: Record<UserRole, { label: string; className: string }> = {
  Admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  SalesManager: { label: 'Manager', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  SalesMember: { label: 'Sales', className: 'bg-green-100 text-green-800 border-green-200' },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const { label, className } = roleStyles[role];

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${className} ${sizeStyles[size]}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 9: Create PerformanceCard Component

**Files:**
- Create: `frontend/src/components/common/PerformanceCard.tsx`

- [ ] **Step 1: Create PerformanceCard.tsx**

```typescript
import { KpiSummary, getPerformanceLevel, getPerformanceColor } from '../types/kpi';

interface PerformanceCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  kpi?: KpiSummary;
  metric?: 'calls' | 'meetings' | 'revenue' | 'conversion';
}

export function PerformanceCard({ title, value, subtitle, kpi, metric }: PerformanceCardProps) {
  let bgColor = 'bg-white';
  let borderColor = 'border-gray-200';

  if (kpi && metric) {
    const level = getPerformanceLevel(kpi.conversionRate);
    bgColor = getPerformanceColor(level).split(' ')[1];
    borderColor = getPerformanceColor(level).split(' ')[0].replace('text-', 'border-');
  }

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 transition-all`}>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 10: Create Users List Page

**Files:**
- Create: `frontend/src/pages/Users.tsx`

- [ ] **Step 1: Create Users.tsx page**

```typescript
import { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { userService, UserFilters } from '../services/userService';
import { User, UserRole } from '../types';
import { RoleBadge } from '../components/common/RoleBadge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Table } from '../components/common/Table';
import { useNavigate } from 'react-router-dom';

export function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const filters: UserFilters = {};
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.status = statusFilter;
      const data = await userService.getAll(filters);
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'User',
      accessor: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-gray-500">{user.fullName[0]}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.fullName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Role', accessor: (user: User) => <RoleBadge role={user.role} size="sm" /> },
    { header: 'Manager', accessor: (user: User) => user.managerName || '-' },
    { header: 'Status', accessor: (user: User) => (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {user.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    {
      header: 'Actions',
      accessor: (user: User) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => navigate('/users/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          className="w-40"
        >
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="SalesManager">Manager</option>
          <option value="SalesMember">Sales</option>
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
          className="w-32"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <Table columns={columns} data={filteredUsers} loading={loading} />
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 11: Create User Detail Page

**Files:**
- Create: `frontend/src/pages/UserDetail.tsx`

- [ ] **Step 1: Create UserDetail.tsx page**

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, MapPin } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '../types';
import { RoleBadge } from '../components/common/RoleBadge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PerformanceCard } from '../components/common/PerformanceCard';
import { api } from '../services/api';

interface KpiSummary {
  totalCalls: number;
  totalMeetings: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  conversionRate: number;
  activityScore: number;
}

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'kpi' | 'doctors' | 'activities'>('profile');

  useEffect(() => {
    if (id) loadUserData(id);
  }, [id]);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
      const [userData, kpiData] = await Promise.all([
        userService.getById(userId),
        api.get<KpiSummary>(`/kpi/users/${userId}/summary`).then(res => res.data).catch(() => null),
      ]);
      setUser(userData);
      setKpi(kpiData);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6">User not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(`/users/${id}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex flex-col items-center pb-6 border-b border-gray-200">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-4">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-medium text-gray-500">{user.fullName[0]}</span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{user.fullName}</h2>
              <div className="mt-2">
                <RoleBadge role={user.role} size="md" />
              </div>
              <p className="text-sm text-gray-500 mt-2">{user.email}</p>
            </div>
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </div>
              )}
              {user.managerName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  Manager: {user.managerName}
                </div>
              )}
            </div>
          </Card>

          {kpi && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <PerformanceCard title="Calls" value={kpi.totalCalls} subtitle="Last 30 days" kpi={kpi} metric="calls" />
              <PerformanceCard title="Meetings" value={kpi.totalMeetings} subtitle="Last 30 days" kpi={kpi} metric="meetings" />
              <PerformanceCard title="Revenue" value={`$${kpi.totalRevenue.toLocaleString()}`} subtitle="Last 30 days" kpi={kpi} metric="revenue" />
              <PerformanceCard title="Conversion" value={`${kpi.conversionRate}%`} subtitle={`${kpi.wonDeals}/${kpi.totalDeals} deals`} kpi={kpi} metric="conversion" />
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex border-b border-gray-200 mb-4">
              {(['profile', 'kpi', 'doctors', 'activities'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <RoleBadge role={user.role} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium ${user.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kpi' && kpi && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Overview</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{kpi.totalCalls}</p>
                      <p className="text-sm text-gray-500">Total Calls</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{kpi.totalMeetings}</p>
                      <p className="text-sm text-gray-500">Total Meetings</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{kpi.totalDeals}</p>
                      <p className="text-sm text-gray-500">Total Deals</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{kpi.wonDeals}</p>
                      <p className="text-sm text-gray-500">Won Deals</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600">Won</p>
                    <p className="text-3xl font-bold text-green-700">{kpi.wonDeals}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600">Lost</p>
                    <p className="text-3xl font-bold text-red-700">{kpi.lostDeals}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Activity Score</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.activityScore}</p>
                  <p className="text-xs text-gray-400 mt-1">(calls × 1) + (meetings × 3) + (won × 5)</p>
                </div>
              </div>
            )}

            {activeTab === 'kpi' && !kpi && (
              <p className="text-gray-500">No KPI data available</p>
            )}

            {activeTab === 'doctors' && (
              <p className="text-gray-500">Assigned doctors will be shown here</p>
            )}

            {activeTab === 'activities' && (
              <p className="text-gray-500">Activity history will be shown here</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 12: Update Sidebar Navigation

**Files:**
- Modify: `frontend/src/components/common/Sidebar.tsx`

- [ ] **Step 1: Add Users link to Sidebar**

Find the navigation items and add:

```typescript
{
  label: 'Users',
  path: '/users',
  icon: UsersIcon, // Add Users icon import
},
```

Add import for Users icon from lucide-react.

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 13: Update TopBar for Avatar Display

**Files:**
- Modify: `frontend/src/components/common/TopBar.tsx`

- [ ] **Step 1: Add avatar display to TopBar**

Find where user info is displayed and add avatar next to name:

```typescript
// Replace plain name display with avatar + name
<div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
    {user.avatarUrl ? (
      <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
    ) : (
      <span className="text-sm font-medium text-gray-500">{user.fullName[0]}</span>
    )}
  </div>
  <div>
    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
    <p className="text-xs text-gray-500">{user.role}</p>
  </div>
</div>
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 14: Update App.tsx Routes

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add user routes**

Find where routes are defined and add:

```typescript
import { Users } from './pages/Users';
import { UserDetail } from './pages/UserDetail';

// Add to route configuration:
{
  path: '/users',
  element: <ProtectedRoute><Users /></ProtectedRoute>,
},
{
  path: '/users/:id',
  element: <ProtectedRoute><UserDetail /></ProtectedRoute>,
},
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 15: Extend User Type with AvatarUrl

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add AvatarUrl to User interface**

Find User interface and add:

```typescript
export interface User {
  // ... existing fields ...
  avatarUrl?: string;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 16: Verify Complete Functionality

- [ ] **Step 1: Build backend**

Run: `cd backend && dotnet build`
Expected: 0 Warning(s), 0 Error(s)

- [ ] **Step 2: Build frontend**

Run: `cd frontend && npm run build`
Expected: Compiles successfully

- [ ] **Step 3: Test API endpoints with Swagger**

Test these endpoints:
- `GET /api/users` - returns list of users
- `GET /api/users/{id}` - returns user with AvatarUrl
- `GET /api/kpi/users/{id}/summary` - returns KPI summary

- [ ] **Step 4: Test frontend pages**

Navigate to:
- `/users` - User list page
- `/users/{id}` - User detail page

---

## Completion Criteria

- [ ] Build succeeds with 0 warnings, 0 errors (backend and frontend)
- [ ] User entity has AvatarUrl field
- [ ] KPI service calculates: calls, meetings, deals, revenue, conversion rate, activity score
- [ ] KPI endpoints return daily/weekly/monthly data
- [ ] Frontend has userService.ts with all CRUD operations
- [ ] Users list page with search, filter by role/status
- [ ] User detail page with profile and KPI tabs
- [ ] RoleBadge component with colored badges
- [ ] PerformanceCard component with color coding
- [ ] Sidebar has Users navigation link
- [ ] TopBar shows user avatar
- [ ] Routes: /users, /users/:id configured