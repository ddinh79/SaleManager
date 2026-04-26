# Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Module 3.6 - Role-based dashboards (CEO, Manager, Sales) with backend APIs and frontend UI.

**Architecture:** Three separate dashboard pages, each with own backend DTOs/Service/Controller. Data aggregated from existing Deals, Orders, Doctors, Users, Activities tables.

**Tech Stack:** .NET 8, Entity Framework Core (SQLite), React 18, TailwindCSS

---

## File Map

### Backend (Create/Modify)
```
backend/
  DTOs/
    DashboardDtos.cs           # NEW - CEO/Manager/Sales response DTOs
  Services/
    IDashboardService.cs       # NEW
    DashboardService.cs        # NEW
  Controllers/
    DashboardController.cs     # NEW
  Program.cs                   # Modify - register DashboardService
```

### Frontend (Create/Modify)
```
frontend/src/
  services/dashboardService.ts   # NEW
  pages/
    CEODashboard.tsx             # NEW
    ManagerDashboard.tsx          # NEW
    SalesDashboard.tsx           # NEW
  navigation/menuConfig.tsx      # Modify - add dashboard menu items
  App.tsx                         # Modify - add dashboard routes
```

---

## Backend Tasks

### Task 1: Create Dashboard DTOs

**Files:**
- Create: `backend/DTOs/DashboardDtos.cs`

- [ ] **Step 1: Create DashboardDtos.cs**

Create `backend/DTOs/DashboardDtos.cs`:
```csharp
namespace SalesSystem.DTOs;

// ============ CEO Dashboard ============

public class CEODashboardResponse
{
    public decimal TotalRevenue { get; set; }
    public decimal PipelineValue { get; set; }
    public decimal WeightedForecast { get; set; }
    public decimal ConversionRate { get; set; }
    public int TotalDeals { get; set; }
    public int WonDeals { get; set; }
    public int ActiveDeals { get; set; }
    public List<TopDoctorItem> TopDoctors { get; set; } = new();
    public List<RevenueBySalesItem> RevenueBySales { get; set; } = new();
}

public class TopDoctorItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Hospital { get; set; } = string.Empty;
    public decimal TotalValue { get; set; }
}

public class RevenueBySalesItem
{
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int DealsWon { get; set; }
}

// ============ Manager Dashboard ============

public class ManagerDashboardResponse
{
    public int TeamSize { get; set; }
    public decimal TeamPipelineValue { get; set; }
    public decimal TeamWeightedForecast { get; set; }
    public int DealsClosingThisMonth { get; set; }
    public List<InactiveSalesItem> InactiveSalesMembers { get; set; } = new();
    public List<TeamPerformanceItem> TeamPerformance { get; set; } = new();
}

public class InactiveSalesItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime LastActivity { get; set; }
    public int DaysInactive { get; set; }
}

public class TeamPerformanceItem
{
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public int DealsWon { get; set; }
    public decimal Revenue { get; set; }
    public int TasksCompleted { get; set; }
}

// ============ Sales Dashboard ============

public class SalesDashboardResponse
{
    public int MyDeals { get; set; }
    public decimal MyPipelineValue { get; set; }
    public decimal MyWeightedForecast { get; set; }
    public int TasksToday { get; set; }
    public int TasksOverdue { get; set; }
    public KpiProgressItem KpiProgress { get; set; } = new();
    public List<RecentActivityItem> RecentActivities { get; set; } = new();
}

public class KpiProgressItem
{
    public decimal TargetRevenue { get; set; }
    public decimal CurrentRevenue { get; set; }
    public int TargetDeals { get; set; }
    public int WonDeals { get; set; }
}

public class RecentActivityItem
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/DTOs/DashboardDtos.cs
git commit -m "feat(dashboard): add dashboard DTOs"
```

---

### Task 2: Create IDashboardService

**Files:**
- Create: `backend/Services/IDashboardService.cs`

- [ ] **Step 1: Create IDashboardService.cs**

Create `backend/Services/IDashboardService.cs`:
```csharp
using SalesSystem.DTOs;

namespace SalesSystem.Services;

public interface IDashboardService
{
    Task<CEODashboardResponse> GetCEODashboardAsync();
    Task<ManagerDashboardResponse> GetManagerDashboardAsync(Guid managerId);
    Task<SalesDashboardResponse> GetSalesDashboardAsync(Guid salesId);
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/Services/IDashboardService.cs
git commit -m "feat(dashboard): add IDashboardService interface"
```

---

### Task 3: Create DashboardService

**Files:**
- Create: `backend/Services/DashboardService.cs`

- [ ] **Step 1: Create DashboardService.cs**

Create `backend/Services/DashboardService.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;
    private readonly IDealRepository _dealRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IUserRepository _userRepo;

    public DashboardService(
        AppDbContext context,
        IDealRepository dealRepo,
        IOrderRepository orderRepo,
        IDoctorRepository doctorRepo,
        IUserRepository userRepo)
    {
        _context = context;
        _dealRepo = dealRepo;
        _orderRepo = orderRepo;
        _doctorRepo = doctorRepo;
        _userRepo = userRepo;
    }

    public async Task<CEODashboardResponse> GetCEODashboardAsync()
    {
        var allDeals = await _dealRepo.GetAllWithDetailsAsync();
        var completedOrders = await _orderRepo.FindAsync(o => o.Status == OrderStatus.COMPLETED);

        var totalRevenue = completedOrders.Sum(o => o.TotalValue);
        var activeDeals = allDeals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST).ToList();
        var wonDeals = allDeals.Where(d => d.Stage == DealStage.WON).ToList();
        var pipelineValue = activeDeals.Sum(d => d.TotalValue);
        var weightedForecast = activeDeals.Sum(d => d.TotalValue * d.Probability / 100);
        var conversionRate = allDeals.Any() ? (wonDeals.Count * 100.0m / allDeals.Count) : 0;

        var topDoctors = allDeals
            .Where(d => d.Stage == DealStage.WON)
            .GroupBy(d => d.Doctor)
            .Select(g => new TopDoctorItem
            {
                Id = g.Key.Id,
                Name = g.Key.Name,
                Hospital = g.Key.Hospital?.Name ?? "",
                TotalValue = g.Sum(d => d.TotalValue)
            })
            .OrderByDescending(x => x.TotalValue)
            .Take(5)
            .ToList();

        var revenueBySales = wonDeals
            .GroupBy(d => d.Sales)
            .Select(g => new RevenueBySalesItem
            {
                SalesId = g.Key.Id,
                SalesName = g.Key.Name,
                Revenue = g.Sum(d => d.TotalValue),
                DealsWon = g.Count()
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        return new CEODashboardResponse
        {
            TotalRevenue = totalRevenue,
            PipelineValue = pipelineValue,
            WeightedForecast = weightedForecast,
            ConversionRate = Math.Round(conversionRate, 1),
            TotalDeals = allDeals.Count(),
            WonDeals = wonDeals.Count,
            ActiveDeals = activeDeals.Count,
            TopDoctors = topDoctors,
            RevenueBySales = revenueBySales
        };
    }

    public async Task<ManagerDashboardResponse> GetManagerDashboardAsync(Guid managerId)
    {
        var teamSales = await _userRepo.FindAsync(u => u.ManagerId == managerId);
        var salesIds = teamSales.Select(u => u.Id).ToList();

        var teamDeals = await _dealRepo.GetByTeamSalesIdsAsync(salesIds);
        var activeDeals = teamDeals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST).ToList();
        var wonDeals = teamDeals.Where(d => d.Stage == DealStage.WON).ToList();

        var cutoffDate = DateTime.UtcNow.AddDays(-5);
        var inactiveSales = teamSales
            .Where(u => !_context.Activities.Any(a => a.CreatedAt >= cutoffDate && a.UserId == u.Id))
            .Select(u => new InactiveSalesItem
            {
                Id = u.Id,
                Name = u.Name,
                LastActivity = _context.Activities.Where(a => a.UserId == u.Id).OrderByDescending(a => a.CreatedAt).Select(a => a.CreatedAt).FirstOrDefault(),
                DaysInactive = (int)(DateTime.UtcNow - (_context.Activities.Where(a => a.UserId == u.Id).OrderByDescending(a => a.CreatedAt).Select(a => a.CreatedAt).FirstOrDefault())).FirstOrDefault().TotalDays)
            })
            .ToList();

        var teamPerformance = teamSales
            .Select(s => new TeamPerformanceItem
            {
                SalesId = s.Id,
                SalesName = s.Name,
                DealsWon = wonDeals.Count(d => d.SalesId == s.Id),
                Revenue = wonDeals.Where(d => d.SalesId == s.Id).Sum(d => d.TotalValue),
                TasksCompleted = _context.Activities.Count(a => a.UserId == s.Id)
            })
            .ToList();

        var endOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, DateTime.DaysInMonth(DateTime.UtcNow.Year, DateTime.UtcNow.Month));
        var dealsClosingThisMonth = activeDeals.Count(d => d.ExpectedCloseDate.HasValue && d.ExpectedCloseDate <= endOfMonth);

        return new ManagerDashboardResponse
        {
            TeamSize = teamSales.Count(),
            TeamPipelineValue = activeDeals.Sum(d => d.TotalValue),
            TeamWeightedForecast = activeDeals.Sum(d => d.TotalValue * d.Probability / 100),
            DealsClosingThisMonth = dealsClosingThisMonth,
            InactiveSalesMembers = inactiveSales,
            TeamPerformance = teamPerformance
        };
    }

    public async Task<SalesDashboardResponse> GetSalesDashboardAsync(Guid salesId)
    {
        var salesDeals = await _dealRepo.GetBySalesIdAsync(salesId);
        var activeDeals = salesDeals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST).ToList();
        var wonDeals = salesDeals.Where(d => d.Stage == DealStage.WON).ToList();

        var completedOrders = await _orderRepo.FindAsync(o => o.Status == OrderStatus.COMPLETED && o.Deal != null && o.Deal.SalesId == salesId);
        var myRevenue = completedOrders.Sum(o => o.TotalValue);

        var today = DateTime.UtcNow.Date;
        var tasksToday = await Task.FromResult(0); // Placeholder - will link to tasks
        var tasksOverdue = await Task.FromResult(0); // Placeholder - will link to tasks

        var cutoff = DateTime.UtcNow.AddDays(-3);
        var recentActivities = await _context.Activities
            .Where(a => a.UserId == salesId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .Select(a => new RecentActivityItem
            {
                Id = a.Id,
                Type = a.Type.ToString(),
                DoctorName = a.Doctor?.Name ?? "",
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return new SalesDashboardResponse
        {
            MyDeals = activeDeals.Count,
            MyPipelineValue = activeDeals.Sum(d => d.TotalValue),
            MyWeightedForecast = activeDeals.Sum(d => d.TotalValue * d.Probability / 100),
            TasksToday = 0,
            TasksOverdue = 0,
            KpiProgress = new KpiProgressItem
            {
                TargetRevenue = 100000000,
                CurrentRevenue = myRevenue,
                TargetDeals = 20,
                WonDeals = wonDeals.Count
            },
            RecentActivities = recentActivities
        };
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/Services/DashboardService.cs
git commit -m "feat(dashboard): add DashboardService"
```

---

### Task 4: Create DashboardController

**Files:**
- Create: `backend/Controllers/DashboardController.cs`

- [ ] **Step 1: Create DashboardController.cs**

Create `backend/Controllers/DashboardController.cs`:
```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpGet("ceo")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetCEODashboard()
    {
        var result = await _dashboardService.GetCEODashboardAsync();
        return Ok(result);
    }

    [HttpGet("manager")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult> GetManagerDashboard()
    {
        var managerId = GetCurrentUserId();
        var result = await _dashboardService.GetManagerDashboardAsync(managerId);
        return Ok(result);
    }

    [HttpGet("sales")]
    [Authorize(Roles = "Admin,SalesManager,SalesMember")]
    public async Task<ActionResult> GetSalesDashboard()
    {
        var salesId = GetCurrentUserId();
        var result = await _dashboardService.GetSalesDashboardAsync(salesId);
        return Ok(result);
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add backend/Controllers/DashboardController.cs
git commit -m "feat(dashboard): add DashboardController with CEO/Manager/Sales endpoints"
```

---

### Task 5: Register DashboardService in DI

**Files:**
- Modify: `backend/Program.cs`

- [ ] **Step 1: Read Program.cs**

Run: `Read backend/Program.cs`

- [ ] **Step 2: Add DashboardService DI registration**

Add:
```csharp
// Dashboard
builder.Services.AddScoped<IDashboardService, DashboardService>();
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Program.cs
git commit -m "feat(dashboard): register DashboardService in DI"
```

---

## Frontend Tasks

### Task 6: Create dashboardService.ts

**Files:**
- Create: `frontend/src/services/dashboardService.ts`

- [ ] **Step 1: Create dashboardService.ts**

Create `frontend/src/services/dashboardService.ts`:
```typescript
import api from './api';

export interface TopDoctorItem {
  id: string;
  name: string;
  hospital: string;
  totalValue: number;
}

export interface RevenueBySalesItem {
  salesId: string;
  salesName: string;
  revenue: number;
  dealsWon: number;
}

export interface CEODashboardResponse {
  totalRevenue: number;
  pipelineValue: number;
  weightedForecast: number;
  conversionRate: number;
  totalDeals: number;
  wonDeals: number;
  activeDeals: number;
  topDoctors: TopDoctorItem[];
  revenueBySales: RevenueBySalesItem[];
}

export interface InactiveSalesItem {
  id: string;
  name: string;
  lastActivity: string;
  daysInactive: number;
}

export interface TeamPerformanceItem {
  salesId: string;
  salesName: string;
  dealsWon: number;
  revenue: number;
  tasksCompleted: number;
}

export interface ManagerDashboardResponse {
  teamSize: number;
  teamPipelineValue: number;
  teamWeightedForecast: number;
  dealsClosingThisMonth: number;
  inactiveSalesMembers: InactiveSalesItem[];
  teamPerformance: TeamPerformanceItem[];
}

export interface RecentActivityItem {
  id: string;
  type: string;
  doctorName: string;
  createdAt: string;
}

export interface KpiProgressItem {
  targetRevenue: number;
  currentRevenue: number;
  targetDeals: number;
  wonDeals: number;
}

export interface SalesDashboardResponse {
  myDeals: number;
  myPipelineValue: number;
  myWeightedForecast: number;
  tasksToday: number;
  tasksOverdue: number;
  kpiProgress: KpiProgressItem;
  recentActivities: RecentActivityItem[];
}

export const dashboardService = {
  getCEODashboard: async (): Promise<CEODashboardResponse> => {
    const response = await api.get('/dashboard/ceo');
    return response.data;
  },

  getManagerDashboard: async (): Promise<ManagerDashboardResponse> => {
    const response = await api.get('/dashboard/manager');
    return response.data;
  },

  getSalesDashboard: async (): Promise<SalesDashboardResponse> => {
    const response = await api.get('/dashboard/sales');
    return response.data;
  },
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/dashboardService.ts
git commit -m "feat(dashboard): add dashboardService with CEO/Manager/Sales APIs"
```

---

### Task 7: Create CEODashboard.tsx

**Files:**
- Create: `frontend/src/pages/CEODashboard.tsx`

- [ ] **Step 1: Create CEODashboard.tsx**

Create `frontend/src/pages/CEODashboard.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { dashboardService, type CEODashboardResponse } from '../services/dashboardService';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';

export const CEODashboard: React.FC = () => {
  const [data, setData] = useState<CEODashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await dashboardService.getCEODashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load CEO dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">CEO Dashboard</h1>
        <p className="text-slate-500">Overview of entire business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(data.totalRevenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pipeline Value</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(data.pipelineValue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-slate-800">{data.conversionRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Deals</p>
              <p className="text-2xl font-bold text-slate-800">{data.activeDeals}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Doctors</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-sm font-semibold text-slate-600">Doctor</th>
                <th className="text-left py-2 text-sm font-semibold text-slate-600">Hospital</th>
                <th className="text-right py-2 text-sm font-semibold text-slate-600">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.topDoctors.map((doctor) => (
                <tr key={doctor.id} className="border-b border-slate-100">
                  <td className="py-3 text-sm text-slate-800">{doctor.name}</td>
                  <td className="py-3 text-sm text-slate-600">{doctor.hospital}</td>
                  <td className="py-3 text-sm text-right font-semibold text-slate-800">
                    {formatCurrency(doctor.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue by Sales</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-sm font-semibold text-slate-600">Sales</th>
                <th className="text-right py-2 text-sm font-semibold text-slate-600">Deals Won</th>
                <th className="text-right py-2 text-sm font-semibold text-slate-600">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.revenueBySales.map((item) => (
                <tr key={item.salesId} className="border-b border-slate-100">
                  <td className="py-3 text-sm text-slate-800">{item.salesName}</td>
                  <td className="py-3 text-sm text-right text-slate-600">{item.dealsWon}</td>
                  <td className="py-3 text-sm text-right font-semibold text-slate-800">
                    {formatCurrency(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/CEODashboard.tsx
git commit -m "feat(dashboard): add CEO Dashboard page"
```

---

### Task 8: Create ManagerDashboard.tsx

**Files:**
- Create: `frontend/src/pages/ManagerDashboard.tsx`

- [ ] **Step 1: Create ManagerDashboard.tsx**

Create `frontend/src/pages/ManagerDashboard.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { dashboardService, type ManagerDashboardResponse } from '../services/dashboardService';
import { Users, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const [data, setData] = useState<ManagerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await dashboardService.getManagerDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load manager dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
        <p className="text-slate-500">Team performance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Team Size</p>
              <p className="text-2xl font-bold text-slate-800">{data.teamSize}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Team Pipeline</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(data.teamPipelineValue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Closing This Month</p>
              <p className="text-2xl font-bold text-slate-800">{data.dealsClosingThisMonth}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Inactive Members</p>
              <p className="text-2xl font-bold text-slate-800">{data.inactiveSalesMembers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Team Performance</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-sm font-semibold text-slate-600">Sales</th>
              <th className="text-right py-2 text-sm font-semibold text-slate-600">Deals Won</th>
              <th className="text-right py-2 text-sm font-semibold text-slate-600">Revenue</th>
              <th className="text-right py-2 text-sm font-semibold text-slate-600">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {data.teamPerformance.map((member) => (
              <tr key={member.salesId} className="border-b border-slate-100">
                <td className="py-3 text-sm text-slate-800">{member.salesName}</td>
                <td className="py-3 text-sm text-right text-slate-600">{member.dealsWon}</td>
                <td className="py-3 text-sm text-right font-semibold text-slate-800">
                  {formatCurrency(member.revenue)}
                </td>
                <td className="py-3 text-sm text-right text-slate-600">{member.tasksCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Inactive Alert */}
      {data.inactiveSalesMembers.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Inactive Team Members</h3>
          </div>
          <div className="space-y-2">
            {data.inactiveSalesMembers.map((member) => (
              <div key={member.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-slate-800">{member.name}</span>
                <span className="text-sm text-red-600">{member.daysInactive} days inactive</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/ManagerDashboard.tsx
git commit -m "feat(dashboard): add Manager Dashboard page"
```

---

### Task 9: Create SalesDashboard.tsx

**Files:**
- Create: `frontend/src/pages/SalesDashboard.tsx`

- [ ] **Step 1: Create SalesDashboard.tsx**

Create `frontend/src/pages/SalesDashboard.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { dashboardService, type SalesDashboardResponse } from '../services/dashboardService';
import { Briefcase, TrendingUp, CheckCircle, Activity } from 'lucide-react';

export const SalesDashboard: React.FC = () => {
  const [data, setData] = useState<SalesDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await dashboardService.getSalesDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load sales dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const kpiPercent = data.kpiProgress.targetRevenue > 0
    ? Math.round((data.kpiProgress.currentRevenue / data.kpiProgress.targetRevenue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Dashboard</h1>
        <p className="text-slate-500">Your personal performance overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">My Deals</p>
              <p className="text-2xl font-bold text-slate-800">{data.myDeals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">My Pipeline</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(data.myPipelineValue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tasks Today</p>
              <p className="text-2xl font-bold text-slate-800">{data.tasksToday}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-100 text-red-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">KPI Progress</p>
              <p className="text-2xl font-bold text-slate-800">{kpiPercent}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* KPI Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">KPI Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Revenue Target</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(data.kpiProgress.currentRevenue)} / {formatCurrency(data.kpiProgress.targetRevenue)}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full"
                style={{ width: `${Math.min(kpiPercent, 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{data.kpiProgress.wonDeals}</p>
              <p className="text-sm text-slate-500">Deals Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{data.kpiProgress.targetDeals}</p>
              <p className="text-sm text-slate-500">Target Deals</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activities */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {data.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-700">{activity.type}</span>
                  <span className="text-xs text-slate-400">{formatDate(activity.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600">{activity.doctorName}</p>
              </div>
            </div>
          ))}
          {data.recentActivities.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No recent activities</p>
          )}
        </div>
      </Card>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/SalesDashboard.tsx
git commit -m "feat(dashboard): add Sales Dashboard page"
```

---

### Task 10: Add Dashboard Routes to App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Read App.tsx**

Run: `Read frontend/src/App.tsx`

- [ ] **Step 2: Add dashboard imports and routes**

Add imports:
```tsx
const CEODashboard = lazy(() => import('./pages/CEODashboard').then(m => ({ default: m.CEODashboard })));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const SalesDashboard = lazy(() => import('./pages/SalesDashboard').then(m => ({ default: m.SalesDashboard })));
```

Add routes:
```tsx
<Route path="dashboard/ceo" element={<CEODashboard />} />
<Route path="dashboard/manager" element={<ManagerDashboard />} />
<Route path="dashboard/sales" element={<SalesDashboard />} />
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(dashboard): add dashboard routes to App.tsx"
```

---

### Task 11: Add Dashboard Menu Items

**Files:**
- Modify: `frontend/src/navigation/menuConfig.tsx`

- [ ] **Step 1: Read menuConfig.tsx**

Run: `Read frontend/src/navigation/menuConfig.tsx`

- [ ] **Step 2: Add dashboard menu items**

Add imports and menu items:
```tsx
import { LayoutDashboard, Eye, Users, Briefcase } from 'lucide-react';
```

Add to MAIN section:
```tsx
{ label: 'CEO Dashboard', path: '/dashboard/ceo', icon: <Eye className="w-5 h-5" />, roles: ['Admin'] },
{ label: 'Manager Dashboard', path: '/dashboard/manager', icon: <Users className="w-5 h-5" />, roles: ['Admin', 'SalesManager'] },
{ label: 'My Dashboard', path: '/dashboard/sales', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['Admin', 'SalesManager', 'SalesMember'] },
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/navigation/menuConfig.tsx
git commit -m "feat(dashboard): add dashboard menu items"
```

---

## Verification

After all tasks:

1. **Backend build:**
   ```bash
   cd backend; dotnet build
   ```
   Expected: 0 errors

2. **Frontend TypeScript:**
   ```bash
   cd frontend; npx tsc --noEmit
   ```
   Expected: 0 errors

3. **Test navigation:**
   - Login as Admin → should see CEO Dashboard, Manager Dashboard, My Dashboard in menu
   - Login as SalesManager → should see Manager Dashboard, My Dashboard in menu
   - Login as SalesMember → should see My Dashboard in menu

---

## Self-Review Checklist

- [ ] All spec requirements covered by tasks?
- [ ] No TBD/TODO placeholders?
- [ ] Types consistent across tasks?
- [ ] All builds pass?
- [ ] Role-based access enforced (CEO=Admin, Manager=Admin/SalesManager, Sales=All)?
- [ ] All 3 dashboard endpoints implemented?