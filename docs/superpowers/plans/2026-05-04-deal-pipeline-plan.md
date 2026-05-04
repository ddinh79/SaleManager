# Deal Pipeline Enhancement - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance Kanban deal pipeline with SignalR realtime, gap-based ordering, optimistic UI, concurrency guards, and structured lost reason capture.

**Architecture:** .NET 8 backend with SignalR hub at `/hubs/deals`, EF Core + SQLite. React 18 frontend with `@hello-pangea/dnd` for drag-drop, SignalR client for realtime, Zustand for state.

**Tech Stack:** .NET 8, Entity Framework Core, SignalR, React 18, TypeScript, Zustand, `@hello-pangea/dnd`

---

## File Structure

### Backend (modified)
- `backend/Entities/Deal.cs` - add Position, LostReason, LostNotes, Version
- `backend/Entities/Enums.cs` - add LostReason enum
- `backend/DTOs/` - UpdateStageRequest, ReorderRequest, PipelineResponse updates
- `backend/Hubs/DealHub.cs` - new SignalR hub
- `backend/Services/DealService.cs` - reorder logic, concurrency, metrics, SignalR broadcast
- `backend/Controllers/DealsController.cs` - stage with version, reorder endpoint
- `backend/Program.cs` - register SignalR

### Frontend (modified)
- `frontend/src/types/index.ts` - add lost reason types
- `frontend/src/services/dealService.ts` - add reorder, expectedVersion
- `frontend/src/hooks/useDealSignalR.ts` - new SignalR hook with polling fallback
- `frontend/src/pages/Deals.tsx` - optimistic UI, metrics, filters, SignalR
- `frontend/src/components/deals/LostReasonModal.tsx` - new modal
- `frontend/src/components/deals/DealCard.tsx` - ai_score, hot indicator

---

## Backend Tasks

### Task 1: Deal Entity & Enum Changes

**Files:**
- Modify: `backend/Entities/Deal.cs`
- Modify: `backend/Entities/Enums.cs`
- Create: `backend/DTOs/UpdateStageRequest.cs`
- Create: `backend/DTOs/ReorderRequest.cs`
- Create: `backend/DTOs/PipelineResponse.cs`

- [ ] **Step 1a: Read existing Deal.cs**

Read: `backend/Entities/Deal.cs`

- [ ] **Step 1b: Add Position, LostReason, LostNotes, Version to Deal.cs**

Edit `backend/Entities/Deal.cs` - add after existing fields:
```csharp
/// <summary>
/// Gap-based position for ordering within a pipeline stage column.
/// </summary>
public int Position { get; set; } = 0;

/// <summary>
/// Structured reason when deal is marked as LOST.
/// </summary>
public string? LostReason { get; set; }

/// <summary>
/// Optional free-text notes when deal is marked as LOST.
/// </summary>
public string? LostNotes { get; set; }

/// <summary>
/// Concurrency version token for optimistic concurrency control.
/// </summary>
public int Version { get; set; } = 0;
```

- [ ] **Step 1c: Add LostReason enum to Enums.cs**

Read: `backend/Entities/Enums.cs`

Edit `backend/Entities/Enums.cs` - add after DealStage enum:
```csharp
/// <summary>
/// Reason a deal was lost.
/// </summary>
public enum LostReason
{
    COMPETITOR,
    BUDGET,
    TIMELINE,
    NO_RESPONSE,
    PRODUCT_MISMATCH,
    OTHER
}
```

- [ ] **Step 1d: Read and update UpdateStageRequest DTO**

Read: `backend/DTOs/UpdateStageRequest.cs`

Edit `backend/DTOs/UpdateStageRequest.cs` - add after existing fields:
```csharp
/// <summary>
/// Expected version for concurrency check.
/// </summary>
public int ExpectedVersion { get; set; }

/// <summary>
/// Lost reason if moving to LOST stage.
/// </summary>
public string? LostReason { get; set; }

/// <summary>
/// Optional notes when marking as LOST.
/// </summary>
public string? LostNotes { get; set; }
```

- [ ] **Step 1e: Create ReorderRequest DTO**

Create: `backend/DTOs/ReorderRequest.cs`
```csharp
namespace SalesSystem.DTOs;

public class ReorderRequest
{
    public List<ReorderItem> Items { get; set; } = new();
}

public class ReorderItem
{
    public Guid DealId { get; set; }
    public int Position { get; set; }
    public string Stage { get; set; } = string.Empty;
}
```

- [ ] **Step 1f: Update PipelineResponse DTO to include metrics**

Read: `backend/DTOs/PipelineResponse.cs`

Edit `backend/DTOs/PipelineResponse.cs`:
```csharp
public class PipelineResponse
{
    public Dictionary<string, List<DealResponse>> Stages { get; set; } = new();
    public Dictionary<string, StageMetric> Metrics { get; set; } = new();
}

public class StageMetric
{
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
}
```

- [ ] **Step 1g: Add System.Text.Json for LostReason enum conversion**

Read top of `backend/DTOs/UpdateStageRequest.cs` to check using statements. The LostReason enum will serialize as string if configured in Program.cs JSON options (verify later in Task 5).

- [ ] **Step 1h: Run dotnet build to verify**

Run: `cd backend && dotnet build`
Expected: BUILD SUCCEEDED (no output means success)

---

### Task 2: Create DealHub SignalR Hub

**Files:**
- Create: `backend/Hubs/DealHub.cs`

- [ ] **Step 2a: Create Hubs directory**

Run: `New-Item -ItemType Directory -Path backend/Hubs -Force`

- [ ] **Step 2b: Create DealHub.cs**

Create: `backend/Hubs/DealHub.cs`
```csharp
using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Hubs;

public class DealHub : Hub
{
    private static readonly HashSet<string> _pipelineGroups = new();

    public async Task JoinPipeline(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Pipeline");
        _pipelineGroups.Add(Context.ConnectionId);
    }

    public async Task LeavePipeline()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Pipeline");
        _pipelineGroups.Remove(Context.ConnectionId);
    }

    public async Task DealUpdated(Guid dealId, string stage, int position, int version)
    {
        await Clients.Group("Pipeline").SendAsync("DealUpdated", new
        {
            Type = "deal_updated",
            DealId = dealId,
            Stage = stage,
            Position = position,
            Version = version
        });
    }

    public async Task DealCreated(Guid dealId)
    {
        await Clients.Group("Pipeline").SendAsync("DealCreated", new
        {
            Type = "deal_created",
            DealId = dealId
        });
    }

    public async Task DealDeleted(Guid dealId)
    {
        await Clients.Group("Pipeline").SendAsync("DealDeleted", new
        {
            Type = "deal_deleted",
            DealId = dealId
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _pipelineGroups.Remove(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
```

- [ ] **Step 2c: Register DealHub in Program.cs**

Read: `backend/Program.cs`

Find the section where services are registered (around `builder.Services.AddControllers()`) and add:
```csharp
builder.Services.AddSignalR();
```

Find the section with `app.UseEndpoints()` or `app.MapControllers()` and add:
```csharp
app.MapHub<DealHub>("/hubs/deals");
```

Also add after `app.UseRouting()`:
```csharp
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
```

Note: Place before `app.UseAuthentication()` and `app.UseAuthorization()`.

---

### Task 3: DealsController Changes

**Files:**
- Modify: `backend/Controllers/DealsController.cs`

- [ ] **Step 3a: Read DealsController.cs**

Already read earlier - reference for context.

- [ ] **Step 3b: Add IHubContext to controller**

Edit constructor of `backend/Controllers/DealsController.cs`:
```csharp
private readonly IDealService _dealService;
private readonly IHubContext<DealHub> _hubContext;

public DealsController(IDealService dealService, IHubContext<DealHub> hubContext)
{
    _dealService = dealService;
    _hubContext = hubContext;
}
```

- [ ] **Step 3c: Add reorder endpoint**

Add after existing `UpdateStage` method:
```csharp
[HttpPut("reorder")]
public async Task<ActionResult> Reorder([FromBody] ReorderRequest request)
{
    try
    {
        await _dealService.ReorderDealsAsync(request);
        return NoContent();
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(ex.Message);
    }
}
```

- [ ] **Step 3d: Pass hubContext to service methods**

In `UpdateStage`, pass hubContext to `UpdateStageAsync`:
```csharp
var deal = await _dealService.UpdateStageAsync(id, request, salesId, role, _hubContext);
```

Note: This requires updating `IDealService` and `DealService` interface/method signatures.

---

### Task 4: DealService Business Logic

**Files:**
- Modify: `backend/Services/IDealService.cs`
- Modify: `backend/Services/DealService.cs`

- [ ] **Step 4a: Read IDealService.cs**

Read: `backend/Services/IDealService.cs`

- [ ] **Step 4b: Update IDealService interface**

Edit `backend/Services/IDealService.cs`:
- Change `UpdateStageAsync` signature to include `IHubContext<DealHub>? hubContext = null`
- Add new method: `Task ReorderDealsAsync(ReorderRequest request);`

```csharp
Task<DealResponse?> UpdateStageAsync(Guid id, UpdateStageRequest request, Guid salesId, string userRole, IHubContext<DealHub>? hubContext = null);
Task ReorderDealsAsync(ReorderRequest request);
```

- [ ] **Step 4c: Update DealService with full implementation**

Read: `backend/Services/DealService.cs`

Edit `using` section - add:
```csharp
using Microsoft.AspNetCore.SignalR;
using SalesSystem.Hubs;
```

Edit constructor - add `IHubContext<DealHub>? hubContext = null` parameter.

Add after existing fields:
```csharp
private readonly IHubContext<DealHub>? _hubContext;
```

Update constructor body:
```csharp
public DealService(..., IHubContext<DealHub>? hubContext = null)
{
    ...
    _hubContext = hubContext;
}
```

- [ ] **Step 4d: Implement gap-based reorder logic**

Add new method in `DealService.cs`:
```csharp
public async Task ReorderDealsAsync(ReorderRequest request)
{
    foreach (var item in request.Items)
    {
        var deal = await _dealRepo.GetByIdAsync(item.DealId);
        if (deal == null) continue;

        if (Enum.TryParse<DealStage>(item.Stage, out var stage))
            deal.Stage = stage;

        deal.Position = item.Position;
        deal.UpdatedAt = DateTime.UtcNow;
        await _dealRepo.UpdateAsync(deal);
    }
}
```

- [ ] **Step 4e: Implement UpdateStageAsync with concurrency + lost reason**

Replace existing `UpdateStageAsync` method body:
```csharp
public async Task<DealResponse?> UpdateStageAsync(Guid id, UpdateStageRequest request, Guid salesId, string userRole, IHubContext<DealHub>? hubContext = null)
{
    var deal = await _dealRepo.GetByIdWithDetailsAsync(id);
    if (deal == null) return null;

    // Ownership check
    if (userRole != "Admin" && deal.SalesId != salesId)
        throw new InvalidOperationException("Not authorized");

    // Concurrency check
    if (request.ExpectedVersion > 0 && deal.Version != request.ExpectedVersion)
        throw new InvalidOperationException("CONCURRENCY_CONFLICT:Deal was modified by another user");

    var newStage = request.Stage;
    var oldStage = deal.Stage;

    // Locked check
    if (oldStage == DealStage.WON || oldStage == DealStage.LOST)
        throw new InvalidOperationException("Cannot change stage of locked deal");

    // Linear progression validation
    if (!IsValidTransition(oldStage, newStage))
        throw new InvalidOperationException($"Invalid stage transition from {oldStage} to {newStage}");

    // WON rule check
    if (newStage == DealStage.WON)
    {
        var hasRecentActivity = await HasRecentActivityAsync(deal.DoctorId, 3);
        if (!hasRecentActivity)
            throw new InvalidOperationException("Cannot move to WON without activity within last 3 days (CALL or MEETING only)");
    }

    // Lost reason validation
    if (newStage == DealStage.LOST && string.IsNullOrEmpty(request.LostReason))
        throw new InvalidOperationException("Lost reason is required");

    deal.Stage = newStage;
    deal.LostReason = request.LostReason;
    deal.LostNotes = request.LostNotes;
    deal.Version++;

    // Auto-create order when deal becomes WON
    if (newStage == DealStage.WON && oldStage != DealStage.WON)
    {
        var order = new Order
        {
            DealId = deal.Id,
            DoctorId = deal.DoctorId,
            Product = deal.Product,
            Quantity = deal.Quantity,
            Price = deal.UnitPrice,
            TotalValue = deal.TotalValue,
            Status = OrderStatus.PENDING_APPROVAL,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _orderRepo.AddAsync(order);
    }

    // Update probability based on stage
    deal.Probability = newStage switch
    {
        DealStage.NEW => 10,
        DealStage.IN_PROGRESS => 40,
        DealStage.NEGOTIATION => 70,
        DealStage.WON => 100,
        DealStage.LOST => 0,
        _ => deal.Probability
    };

    // Set position if moving to new column
    if (oldStage != newStage)
    {
        var maxPos = await _dealRepo.GetMaxPositionInStageAsync(newStage);
        deal.Position = maxPos + 1000;
    }

    deal.UpdatedAt = DateTime.UtcNow;
    await _dealRepo.UpdateAsync(deal);

    // Broadcast via SignalR
    if (hubContext != null)
    {
        await hubContext.Clients.Group("Pipeline").SendAsync("DealUpdated", new
        {
            Type = "deal_updated",
            DealId = deal.Id,
            Stage = deal.Stage.ToString(),
            Position = deal.Position,
            Version = deal.Version
        });
    }

    return MapToDealResponse(deal, deal.Doctor?.Name ?? "");
}
```

- [ ] **Step 4f: Update GetPipelineAsync to include metrics**

Find `GetPipelineAsync` and update the return to include metrics:
```csharp
var grouped = deals.GroupBy(d => d.Stage.ToString())
    .ToDictionary(g => g.Key, g => g.Select(d => MapToDealResponse(d, d.Doctor?.Name ?? "")).ToList());

// Ensure all stages exist
var allStages = new[] { "NEW", "IN_PROGRESS", "NEGOTIATION", "WON", "LOST" };
foreach (var stage in allStages)
{
    if (!grouped.ContainsKey(stage)) grouped[stage] = new List<DealResponse>();
}

// Calculate metrics
var metrics = grouped.ToDictionary(
    g => g.Key,
    g => new StageMetric
    {
        Count = g.Value.Count,
        TotalValue = g.Value.Sum(d => d.TotalValue)
    }
);

return new PipelineResponse { Stages = grouped, Metrics = metrics };
```

- [ ] **Step 4g: Add GetMaxPositionInStageAsync to IDealRepository and DealRepository**

Read: `backend/Repositories/IDealRepository.cs`
Read: `backend/Repositories/DealRepository.cs`

Add to `IDealRepository.cs`:
```csharp
Task<int> GetMaxPositionInStageAsync(DealStage stage);
```

Add implementation to `DealRepository.cs`:
```csharp
public async Task<int> GetMaxPositionInStageAsync(DealStage stage)
{
    var max = await _dbSet
        .Where(d => d.Stage == stage)
        .MaxAsync(d => (int?)d.Position) ?? 0;
    return max;
}
```

- [ ] **Step 4h: Run dotnet build to verify**

Run: `cd backend && dotnet build`
Expected: BUILD SUCCEEDED

---

### Task 5: Verify Backend

- [ ] **Step 5a: Run backend and check startup**

Run: `cd backend && dotnet run`
Expected: No exceptions on startup, database initializes

- [ ] **Step 5b: Test pipeline endpoint via Swagger**

Navigate to http://localhost:5001/swagger
Call `GET /api/deals/pipeline` as admin user
Expected: Returns stages with metrics

---

## Frontend Tasks

### Task 6: Frontend Types & dealService Updates

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/dealService.ts`

- [ ] **Step 6a: Read types/index.ts**

Read: `frontend/src/types/index.ts`

- [ ] **Step 6b: Add LostReason types and expectedVersion to Deal**

In `frontend/src/types/index.ts`, find the Deal type and add:
```typescript
export enum LostReason {
  COMPETITOR = 'COMPETITOR',
  BUDGET = 'BUDGET',
  TIMELINE = 'TIMELINE',
  NO_RESPONSE = 'NO_RESPONSE',
  PRODUCT_MISMATCH = 'PRODUCT_MISMATCH',
  OTHER = 'OTHER',
}

export interface Deal {
  // ... existing fields
  position: number;
  lostReason?: LostReason;
  lostNotes?: string;
  version: number;
}
```

- [ ] **Step 6c: Add PipelineResponse with metrics**

Add to `frontend/src/types/index.ts`:
```typescript
export interface StageMetric {
  count: number;
  totalValue: number;
}

export interface PipelineResponse {
  stages: Record<DealStage, Deal[]>;
  metrics: Record<DealStage, StageMetric>;
}
```

- [ ] **Step 6d: Update UpdateStageRequest with expectedVersion and lostReason**

Find `UpdateStageRequest` and add:
```typescript
export interface UpdateStageRequest {
  stage: DealStage;
  expectedVersion?: number;
  lostReason?: LostReason;
  lostNotes?: string;
}
```

- [ ] **Step 6e: Update dealService.ts**

Read: `frontend/src/services/dealService.ts`

Add reorder method and update stage method:
```typescript
export const dealService = {
  // ... existing methods

  updateStage: async (id: string, stage: DealStage, expectedVersion?: number, lostReason?: LostReason, lostNotes?: string) => {
    const response = await api.put(`/deals/${id}/stage`, {
      stage,
      expectedVersion,
      lostReason,
      lostNotes,
    });
    return response.data;
  },

  reorder: async (items: { dealId: string; position: number; stage: DealStage }[]) => {
    const response = await api.put('/deals/reorder', { items });
    return response.data;
  },
};
```

---

### Task 7: Create useDealSignalR Hook

**Files:**
- Create: `frontend/src/hooks/useDealSignalR.ts`

- [ ] **Step 7a: Check if @microsoft/signalr package is installed**

Read: `frontend/package.json`

If `@microsoft/signalr` is not in dependencies, add:
```bash
cd frontend && npm install @microsoft/signalr
```

- [ ] **Step 7b: Create useDealSignalR hook**

Create: `frontend/src/hooks/useDealSignalR.ts`
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { dealService } from '../services/dealService';
import type { Deal, DealStage } from '../types';

const PIPELINE_HUB_URL = '/hubs/deals';
const POLLING_INTERVAL = 30000; // 30 seconds

export function useDealSignalR(onDealUpdated?: (deal: Partial<Deal>) => void) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const data = await dealService.getPipeline();
        if (onDealUpdated) {
          // Trigger a full reload by passing empty update
          onDealUpdated({} as Deal);
        }
      } catch (e) {
        console.warn('Polling failed:', e);
      }
    }, POLLING_INTERVAL);
  }, [onDealUpdated]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    const authStore = (await import('../store/authStore')).useAuthStore.getState();
    const token = authStore.token;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL || ''}${PIPELINE_HUB_URL}`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.on('DealUpdated', (data: { dealId: string; stage: string; position: number; version: number }) => {
      if (onDealUpdated) {
        onDealUpdated({
          id: data.dealId,
          stage: data.stage as DealStage,
          position: data.position,
          version: data.version,
        });
      }
    });

    connection.on('DealCreated', async (data: { dealId: string }) => {
      if (onDealUpdated) {
        onDealUpdated({ id: data.dealId } as Deal);
      }
    });

    connection.on('DealDeleted', (data: { dealId: string }) => {
      if (onDealUpdated) {
        onDealUpdated({ id: data.dealId, stage: 'DELETED' } as Deal);
      }
    });

    connection.onclose(() => {
      setIsConnected(false);
      startPolling();
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      stopPolling();
    });

    try {
      await connection.start();
      setIsConnected(true);
      stopPolling();
    } catch (e) {
      console.warn('SignalR connection failed, using polling:', e);
      setIsConnected(false);
      startPolling();
    }

    connectionRef.current = connection;
  }, [onDealUpdated, startPolling, stopPolling]);

  useEffect(() => {
    connect();
    return () => {
      connectionRef.current?.stop();
      stopPolling();
    };
  }, [connect, stopPolling]);

  return { isConnected };
}
```

---

### Task 8: Deals.tsx - Optimistic UI, Metrics, Filters, SignalR

**Files:**
- Modify: `frontend/src/pages/Deals.tsx`

- [ ] **Step 8a: Read current Deals.tsx**

Already read earlier.

- [ ] **Step 8b: Add imports and new state**

Add to imports:
```typescript
import { useDealSignalR } from '../hooks/useDealSignalR';
import { useAuthStore } from '../store/authStore';
import { usersService } from '../services/userService';
```

Add to state:
```typescript
const [metrics, setMetrics] = useState<Record<DealStage, StageMetric>>({
  NEW: { count: 0, totalValue: 0 },
  IN_PROGRESS: { count: 0, totalValue: 0 },
  NEGOTIATION: { count: 0, totalValue: 0 },
  WON: { count: 0, totalValue: 0 },
  LOST: { count: 0, totalValue: 0 },
});
const [filterSales, setFilterSales] = useState<string>('');
const [filterProduct, setFilterProduct] = useState<string>('');
const [salesUsers, setSalesUsers] = useState<Array<{ id: string; fullName: string }>>([]);
```

- [ ] **Step 8c: Load sales users for filter**

Add after loadPipeline:
```typescript
useEffect(() => {
  const loadSalesUsers = async () => {
    try {
      const users = await usersService.getUsers();
      setSalesUsers(users.filter((u: any) => u.role === 'SalesMember').map((u: any) => ({ id: u.id, fullName: u.fullName })));
    } catch (e) {
      console.warn('Failed to load sales users');
    }
  };
  loadSalesUsers();
}, []);
```

- [ ] **Step 8d: Create handleDealUpdated callback for SignalR**

Add before loadPipeline:
```typescript
const handleDealUpdated = useCallback((updated: Partial<Deal>) => {
  if ('stage' in updated && updated.stage === 'DELETED') {
    loadPipeline();
    return;
  }
  // For partial updates, refresh full pipeline
  loadPipeline();
}, [loadPipeline]);

const { isConnected } = useDealSignalR(handleDealUpdated);
```

- [ ] **Step 8e: Update loadPipeline to store metrics**

Find loadPipeline and update:
```typescript
const loadPipeline = async () => {
  try {
    const data = await dealService.getPipeline();
    setPipeline(data.stages);
    setMetrics(data.metrics);
  } catch (error) {
    console.error('Failed to load pipeline:', error);
  } finally {
    setLoading(false);
  }
};
```

- [ ] **Step 8f: Update handleDragEnd with optimistic UI**

Replace `handleDragEnd` implementation:
```typescript
const handleDragEnd = async (result: DropResult) => {
  const { draggableId, destination, source } = result;
  if (!destination) return;

  const newStage = destination.droppableId as DealStage;
  const dealId = draggableId;
  const oldStage = source.droppableId as DealStage;

  if (oldStage === newStage && destination.index === source.index) return;

  // Find current deal
  let deal = pipeline[oldStage].find(d => d.id === dealId);
  if (!deal) return;

  // Check if moving to LOST - show modal
  if (newStage === 'LOST' && oldStage !== 'LOST') {
    // Store dealId in a ref or state for modal
    (window as any).__pendingLostDealId = dealId;
    (window as any).__pendingLostDealVersion = deal.version;
    return;
  }

  // Optimistic update
  const optimisticPipeline = { ...pipeline };
  const sourceDeals = [...optimisticPipeline[oldStage]];
  const destDeals = oldStage === newStage ? sourceDeals : [...optimisticPipeline[newStage]];
  const [movedDeal] = sourceDeals.splice(source.index, 1);
  if (oldStage === newStage) {
    sourceDeals.splice(destination.index, 0, movedDeal);
  } else {
    destDeals.splice(destination.index, 0, { ...movedDeal, stage: newStage });
    optimisticPipeline[newStage] = destDeals;
  }
  optimisticPipeline[oldStage] = sourceDeals;
  setPipeline(optimisticPipeline);

  try {
    await dealService.updateStage(dealId, newStage, deal.version);
    // Reload to get fresh data including updated position
    loadPipeline();
  } catch (error) {
    console.error('Failed to update stage:', error);
    // Rollback
    setPipeline(pipeline);
    alert('Failed to move deal: ' + (error as Error).message);
  }
};
```

- [ ] **Step 8g: Add column metrics to column headers**

Find the column rendering and update header:
```typescript
<div className="bg-slate-100 rounded-t-lg px-3 py-2">
  <div className="flex items-center justify-between">
    <span className="font-semibold text-slate-700">{STAGE_LABELS[stage]}</span>
    <span className="text-sm text-slate-500">{pipeline[stage].length}</span>
  </div>
  {metrics[stage] && metrics[stage].totalValue > 0 && (
    <div className="text-xs text-slate-400">
      {new Intl.NumberFormat('vi-VN').format(metrics[stage].totalValue)} VND
    </div>
  )}
</div>
```

- [ ] **Step 8h: Add filter bar above Kanban**

Add after header div:
```typescript
{/* Filter Bar */}
<div className="flex items-center gap-4 mb-4">
  <select
    value={filterSales}
    onChange={(e) => setFilterSales(e.target.value)}
    className="px-3 py-1.5 border rounded-md text-sm"
  >
    <option value="">All Sales</option>
    {salesUsers.map(u => (
      <option key={u.id} value={u.id}>{u.fullName}</option>
    ))}
  </select>
  <select
    value={filterProduct}
    onChange={(e) => setFilterProduct(e.target.value)}
    className="px-3 py-1.5 border rounded-md text-sm"
  >
    <option value="">All Products</option>
    <option value="SILICONE">Silicone</option>
    <option value="CREAM">Cream</option>
  </select>
  {(filterSales || filterProduct) && (
    <button
      onClick={() => { setFilterSales(''); setFilterProduct(''); }}
      className="text-sm text-blue-600 hover:underline"
    >
      Clear filters
    </button>
  )}
</div>
```

- [ ] **Step 8i: Add LostReasonModal and handling**

Import LostReasonModal and add to render:
```typescript
const [lostReasonModalOpen, setLostReasonModalOpen] = useState(false);

const handleLostReasonConfirm = async (reason: LostReason, notes: string) => {
  const dealId = (window as any).__pendingLostDealId;
  const version = (window as any).__pendingLostDealVersion;
  if (!dealId) return;

  try {
    await dealService.updateStage(dealId, 'LOST', version, reason, notes);
    loadPipeline();
  } catch (error) {
    alert('Failed to mark as lost: ' + (error as Error).message);
  } finally {
    setLostReasonModalOpen(false);
    delete (window as any).__pendingLostDealId;
    delete (window as any).__pendingLostDealVersion;
  }
};
```

Add modal to render before closing div:
```typescript
<LostReasonModal
  isOpen={lostReasonModalOpen}
  onClose={() => setLostReasonModalOpen(false)}
  onConfirm={handleLostReasonConfirm}
/>
```

Note: Need to wire up `lostReasonModalOpen` trigger from drag-drop - will be done in Task 9.

---

### Task 9: LostReasonModal Component

**Files:**
- Create: `frontend/src/components/deals/LostReasonModal.tsx`

- [ ] **Step 9a: Create LostReasonModal.tsx**

Create: `frontend/src/components/deals/LostReasonModal.tsx`
```typescript
import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LostReason } from '../../types';

interface LostReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: LostReason, notes: string) => void;
}

const LOST_REASON_OPTIONS: { value: LostReason; label: string }[] = [
  { value: LostReason.COMPETITOR, label: 'Lost to competitor' },
  { value: LostReason.BUDGET, label: 'Budget constraints' },
  { value: LostReason.TIMELINE, label: 'Timeline mismatch' },
  { value: LostReason.NO_RESPONSE, label: 'No response' },
  { value: LostReason.PRODUCT_MISMATCH, label: 'Product mismatch' },
  { value: LostReason.OTHER, label: 'Other' },
];

export const LostReasonModal: React.FC<LostReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState<LostReason | ''>('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, notes);
    setReason('');
    setNotes('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Deal as Lost">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as LostReason)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a reason</option>
            {LOST_REASON_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="Additional details..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!reason}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

- [ ] **Step 9b: Wire up LostReasonModal trigger in Deals.tsx**

In Deals.tsx, when drag ends to LOST column, set modal open:
```typescript
// In handleDragEnd, replace the LOST check block:
if (newStage === 'LOST' && oldStage !== 'LOST') {
  setLostReasonModalOpen(true);
  return;
}
```

And import the modal:
```typescript
import { LostReasonModal } from '../components/deals/LostReasonModal';
```

---

### Task 10: DealCard Enhancements

**Files:**
- Modify: `frontend/src/components/deals/DealCard.tsx`

- [ ] **Step 10a: Read DealCard.tsx**

Read: `frontend/src/components/deals/DealCard.tsx`

- [ ] **Step 10b: Add ai_score and hot indicator display**

Find the card content rendering. Add:
- Show 🔥 emoji + ai_score when `deal.aiScore > 70`
- Red border when deal is overdue (`new Date(deal.expectedCloseDate) < new Date()`)
- High value highlight when `deal.totalValue > 50000000` (50M VND)

Update the card styling conditionally:
```typescript
const isHot = deal.aiScore > 70 || (new Date(deal.expectedCloseDate) < new Date() && deal.stage !== 'WON' && deal.stage !== 'LOST');
const isHighValue = deal.totalValue > 50000000;

return (
  <div className={`
    bg-white rounded-lg p-3 shadow-sm border cursor-pointer
    ${isHot ? 'border-red-400' : 'border-slate-200'}
    ${isHighValue ? 'bg-yellow-50' : ''}
    ${isDragging ? 'shadow-lg' : ''}
  `}>
    {/* Doctor name */}
    <div className="font-medium text-slate-800">{deal.doctorName}</div>

    {/* Value */}
    <div className="text-sm text-slate-600">
      {new Intl.NumberFormat('vi-VN').format(deal.totalValue)} VND
    </div>

    {/* AI score badge */}
    {deal.aiScore > 70 && (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs mt-1">
        🔥 {deal.aiScore}
      </div>
    )}

    {/* Probability */}
    <div className="text-xs text-slate-400 mt-1">
      {deal.probability}% probability
    </div>

    {/* Expected close date */}
    <div className="text-xs text-slate-400">
      📅 {new Date(deal.expectedCloseDate).toLocaleDateString('vi-VN')}
    </div>
  </div>
);
```

---

### Task 11: Verify Frontend

- [ ] **Step 11a: Run npm install**

Run: `cd frontend && npm install`

- [ ] **Step 11b: Run dev server**

Run: `cd frontend && npm run dev`

- [ ] **Step 11c: Verify no build errors**

Expected: No TypeScript errors, no console errors on http://localhost:3000

- [ ] **Step 11d: Test drag-drop flow in browser**

Open DevTools Console, drag a deal between columns:
1. Deal should move immediately (optimistic)
2. On API failure, deal should snap back
3. Column metrics should update

---

## Spec Self-Review

Before handoff, verify:
1. **Spec coverage** - All 6 acceptance criteria map to tasks: SignalR (Task 2, 7), Gap ordering (Task 4e), Metrics (Task 4f), Lost reason (Task 9), Optimistic UI (Task 8f), Concurrency (Task 4e)
2. **Placeholder scan** - No "TBD", "TODO", or vague steps
3. **Type consistency** - DealStage enum matches between backend and frontend, LostReason enum values match exactly

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-05-04-deal-pipeline-plan.md`.**

Two execution approaches:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, verify each step, fast iteration. Uses `subagent-driven-development` skill.

2. **Inline Execution** - Execute tasks in this session using `executing-plans` skill, batch with checkpoints.

Which approach?
