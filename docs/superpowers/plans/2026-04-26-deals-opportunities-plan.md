# Deals / Opportunities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Module 3.4 - Kanban deal pipeline, stage transitions, WON/LOST rules, team-based visibility, pipeline forecast dashboard widget.

**Architecture:** Backend follows existing Service+Repository pattern with linear stage validation and WON rule enforcement. Frontend uses @hello-pangea/dnd for Kanban with detail drawer for editing.

**Tech Stack:** .NET 8, Entity Framework Core (SQLite), React 18, @hello-pangea/dnd, TailwindCSS, Zustand

---

## File Map

### Backend (Create/Modify)
```
backend/
  Entities/
    Enums.cs                    # Add ProductType enum
    Deal.cs                     # Add Quantity, UnitPrice, TotalValue fields
  Repositories/
    IDealRepository.cs          # NEW
    DealRepository.cs           # NEW
  Services/
    IDealService.cs             # NEW
    DealService.cs              # NEW
  Controllers/
    DealsController.cs          # NEW
  DTOs/
    DealDtos.cs                 # NEW (CreateDealRequest, UpdateStageRequest, etc.)
  Data/
    AppDbContext.cs             # Modify: add Deal DbSet config
```

### Frontend (Create/Modify)
```
frontend/src/
  types/index.ts                # Add Deal types
  services/dealService.ts       # NEW
  pages/Deals.tsx               # NEW (Kanban board)
  components/deals/
    AddDealModal.tsx            # NEW
    DealDetailDrawer.tsx        # NEW
    DealCard.tsx                # NEW
  pages/Dashboard.tsx           # Add pipeline widget
  navigation/menuConfig.tsx      # Add deals menu item
  App.tsx                       # Add deals route
```

---

## Backend Tasks

### Task 1: Add ProductType Enum to Enums.cs

**Files:**
- Modify: `backend/Entities/Enums.cs`

- [ ] **Step 1: Read existing Enums.cs**

Run: `Read backend/Entities/Enums.cs`
Expected: Shows existing enums (DealStage, PotentialLevel, Temperature, ActivityType, UserRole)

- [ ] **Step 2: Add ProductType enum**

Edit `backend/Entities/Enums.cs` — add after existing enums:

```csharp
public enum ProductType
{
    SILICONE,
    CREAM
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Entities/Enums.cs
git commit -m "feat(deals): add ProductType enum"
```

---

### Task 2: Update Deal Entity

**Files:**
- Modify: `backend/Entities/Deal.cs`

- [ ] **Step 1: Read existing Deal.cs**

Run: `Read backend/Entities/Deal.cs`
Expected: Shows existing fields (DoctorId, SalesId, Product, Value, Stage, etc.)

- [ ] **Step 2: Update Deal entity**

Replace the entire Deal.cs content with:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Entities;

public class Deal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    [Required]
    public Guid SalesId { get; set; }
    public User Sales { get; set; } = null!;

    public ProductType Product { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [NotMapped]
    public decimal TotalValue => Quantity * UnitPrice;

    public DealStage Stage { get; set; } = DealStage.NEW;

    public int Probability { get; set; } = 10;

    public DateTime? ExpectedCloseDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Deprecated: kept for migration compatibility, use TotalValue instead
    [Column(TypeName = "decimal(18,2)")]
    public decimal Value { get; set; }

    // Navigation
    public Order? Order { get; set; }
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Entities/Deal.cs
git commit -m "feat(deals): add quantity, unitPrice, totalValue to Deal entity"
```

---

### Task 3: Create Deal DTOs

**Files:**
- Create: `backend/DTOs/DealDtos.cs`

- [ ] **Step 1: Check DTOs directory exists**

Run: `ls backend/DTOs/`
Expected: Lists existing DTO files (UserDtos.cs, DoctorDtos.cs, etc.)

- [ ] **Step 2: Create DealDtos.cs**

Create `backend/DTOs/DealDtos.cs`:

```csharp
using SalesSystem.Entities;

namespace SalesSystem.DTOs;

// ============ Requests ============

public class CreateDealRequest
{
    public Guid DoctorId { get; set; }
    public ProductType Product { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateDealRequest
{
    public ProductType? Product { get; set; }
    public int? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateStageRequest
{
    public DealStage Stage { get; set; }
}

// ============ Responses ============

public class DealResponse
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalValue { get; set; }
    public string Stage { get; set; } = string.Empty;
    public int Probability { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PipelineResponse
{
    public Dictionary<string, List<DealResponse>> Stages { get; set; } = new();
}

public class ForecastStageItem
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
    public decimal WeightedValue { get; set; }
}

public class ForecastResponse
{
    public List<ForecastStageItem> Stages { get; set; } = new();
    public decimal TotalPipelineValue { get; set; }
    public decimal WeightedForecast { get; set; }
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/DTOs/DealDtos.cs
git commit -m "feat(deals): add deal DTOs"
```

---

### Task 4: Create IDealRepository

**Files:**
- Create: `backend/Repositories/IDealRepository.cs`

- [ ] **Step 1: Check existing repository structure**

Run: `Read backend/Repositories/IDoctorRepository.cs`
Expected: Shows interface pattern with custom methods

- [ ] **Step 2: Create IDealRepository.cs**

Create `backend/Repositories/IDealRepository.cs`:

```csharp
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IDealRepository : IRepository<Deal>
{
    Task<Deal?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<Deal>> GetBySalesIdAsync(Guid salesId);
    Task<IEnumerable<Deal>> GetByTeamSalesIdsAsync(IEnumerable<Guid> salesIds);
    Task<IEnumerable<Deal>> GetAllWithDetailsAsync();
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Repositories/IDealRepository.cs
git commit -m "feat(deals): add IDealRepository interface"
```

---

### Task 5: Create DealRepository

**Files:**
- Create: `backend/Repositories/DealRepository.cs`

- [ ] **Step 1: Read existing repository pattern**

Run: `Read backend/Repositories/DoctorRepository.cs`
Expected: Shows base class usage, custom query methods

- [ ] **Step 2: Create DealRepository.cs**

Create `backend/Repositories/DealRepository.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class DealRepository : Repository<Deal>, IDealRepository
{
    public DealRepository(AppDbContext context) : base(context) { }

    public async Task<Deal?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .Include(d => d.Doctor.Hospital)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<IEnumerable<Deal>> GetBySalesIdAsync(Guid salesId)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Where(d => d.SalesId == salesId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Deal>> GetByTeamSalesIdsAsync(IEnumerable<Guid> salesIds)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Where(d => salesIds.Contains(d.SalesId))
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Deal>> GetAllWithDetailsAsync()
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Repositories/DealRepository.cs
git commit -m "feat(deals): add DealRepository"
```

---

### Task 6: Create IDealService

**Files:**
- Create: `backend/Services/IDealService.cs`

- [ ] **Step 1: Read existing service interface**

Run: `Read backend/Services/IDoctorService.cs`
Expected: Shows interface pattern

- [ ] **Step 2: Create IDealService.cs**

Create `backend/Services/IDealService.cs`:

```csharp
using SalesSystem.DTOs;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public interface IDealService
{
    Task<DealResponse> CreateDealAsync(CreateDealRequest request, Guid salesId);
    Task<DealResponse?> GetDealByIdAsync(Guid id);
    Task<DealResponse?> UpdateDealAsync(Guid id, UpdateDealRequest request, Guid salesId, string userRole);
    Task<bool> DeleteDealAsync(Guid id, Guid salesId, string userRole);
    Task<PipelineResponse> GetPipelineAsync(Guid? managerId, string userRole, Guid currentUserId);
    Task<ForecastResponse> GetForecastAsync();
    Task<DealResponse?> UpdateStageAsync(Guid id, UpdateStageRequest request, Guid salesId, string userRole);
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Services/IDealService.cs
git commit -m "feat(deals): add IDealService interface"
```

---

### Task 7: Create DealService

**Files:**
- Create: `backend/Services/DealService.cs`

- [ ] **Step 1: Read existing service implementation**

Run: `Read backend/Services/DoctorService.cs`
Expected: Shows implementation pattern with MapToDoctorResponse

- [ ] **Step 2: Create DealService.cs**

Create `backend/Services/DealService.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class DealService : IDealService
{
    private readonly AppDbContext _context;
    private readonly IDealRepository _dealRepo;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IUserRepository _userRepo;

    public DealService(AppDbContext context, IDealRepository dealRepo, IDoctorRepository doctorRepo, IUserRepository userRepo)
    {
        _context = context;
        _dealRepo = dealRepo;
        _doctorRepo = doctorRepo;
        _userRepo = userRepo;
    }

    public async Task<DealResponse> CreateDealAsync(CreateDealRequest request, Guid salesId)
    {
        var doctor = await _doctorRepo.GetByIdAsync(request.DoctorId);
        if (doctor == null) throw new InvalidOperationException("Doctor not found");

        var deal = new Deal
        {
            DoctorId = request.DoctorId,
            SalesId = salesId,
            Product = request.Product,
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            ExpectedCloseDate = request.ExpectedCloseDate,
            Notes = request.Notes,
            Stage = DealStage.NEW,
            Probability = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dealRepo.AddAsync(deal);
        return MapToDealResponse(deal, doctor.Name);
    }

    public async Task<DealResponse?> GetDealByIdAsync(Guid id)
    {
        var deal = await _dealRepo.GetByIdWithDetailsAsync(id);
        if (deal == null) return null;
        return MapToDealResponse(deal, deal.Doctor?.Name ?? "");
    }

    public async Task<DealResponse?> UpdateDealAsync(Guid id, UpdateDealRequest request, Guid salesId, string userRole)
    {
        var deal = await _dealRepo.GetByIdWithDetailsAsync(id);
        if (deal == null) return null;

        // Locked check
        if (deal.Stage == DealStage.WON || deal.Stage == DealStage.LOST)
            throw new InvalidOperationException("Cannot edit locked deal");

        // Ownership check
        if (userRole != "Admin" && deal.SalesId != salesId)
            throw new InvalidOperationException("Not authorized");

        if (request.Product.HasValue) deal.Product = request.Product.Value;
        if (request.Quantity.HasValue) deal.Quantity = request.Quantity.Value;
        if (request.UnitPrice.HasValue) deal.UnitPrice = request.UnitPrice.Value;
        if (request.ExpectedCloseDate.HasValue) deal.ExpectedCloseDate = request.ExpectedCloseDate;
        if (request.Notes != null) deal.Notes = request.Notes;

        deal.UpdatedAt = DateTime.UtcNow;
        await _dealRepo.UpdateAsync(deal);

        return MapToDealResponse(deal, deal.Doctor?.Name ?? "");
    }

    public async Task<bool> DeleteDealAsync(Guid id, Guid salesId, string userRole)
    {
        var deal = await _dealRepo.GetByIdAsync(id);
        if (deal == null) return false;

        if (deal.Stage == DealStage.WON || deal.Stage == DealStage.LOST)
            throw new InvalidOperationException("Cannot delete locked deal");

        if (userRole != "Admin" && deal.SalesId != salesId)
            throw new InvalidOperationException("Not authorized");

        return await _dealRepo.DeleteAsync(id);
    }

    public async Task<PipelineResponse> GetPipelineAsync(Guid? managerId, string userRole, Guid currentUserId)
    {
        IEnumerable<Deal> deals;

        if (userRole == "Admin")
        {
            deals = await _dealRepo.GetAllWithDetailsAsync();
        }
        else if (userRole == "SalesManager")
        {
            // Get all sales under this manager
            var teamSales = await _userRepo.FindAsync(u => u.ManagerId == currentUserId);
            var salesIds = teamSales.Select(u => u.Id);
            deals = await _dealRepo.GetByTeamSalesIdsAsync(salesIds);
        }
        else
        {
            // SalesMember - own deals only
            deals = await _dealRepo.GetBySalesIdAsync(currentUserId);
        }

        var grouped = deals.GroupBy(d => d.Stage.ToString())
            .ToDictionary(g => g.Key, g => g.Select(d => MapToDealResponse(d, d.Doctor?.Name ?? "")).ToList());

        // Ensure all stages exist
        var allStages = new[] { "NEW", "IN_PROGRESS", "NEGOTIATION", "WON", "LOST" };
        foreach (var stage in allStages)
        {
            if (!grouped.ContainsKey(stage)) grouped[stage] = new List<DealResponse>();
        }

        return new PipelineResponse { Stages = grouped };
    }

    public async Task<ForecastResponse> GetForecastAsync()
    {
        var deals = await _dealRepo.GetAllWithDetailsAsync();
        var activeDeals = deals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST).ToList();

        var stageItems = activeDeals.GroupBy(d => d.Stage)
            .Select(g => new ForecastStageItem
            {
                Stage = g.Key.ToString(),
                Count = g.Count(),
                TotalValue = g.Sum(d => d.TotalValue),
                WeightedValue = g.Sum(d => d.TotalValue * d.Probability / 100)
            }).ToList();

        return new ForecastResponse
        {
            Stages = stageItems,
            TotalPipelineValue = activeDeals.Sum(d => d.TotalValue),
            WeightedForecast = activeDeals.Sum(d => d.TotalValue * d.Probability / 100)
        };
    }

    public async Task<DealResponse?> UpdateStageAsync(Guid id, UpdateStageRequest request, Guid salesId, string userRole)
    {
        var deal = await _dealRepo.GetByIdWithDetailsAsync(id);
        if (deal == null) return null;

        // Ownership check
        if (userRole != "Admin" && deal.SalesId != salesId)
            throw new InvalidOperationException("Not authorized");

        var newStage = request.Stage;
        var oldStage = deal.Stage;

        // Locked check - can't transition from WON/LOST
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

        deal.Stage = newStage;
        deal.Probability = newStage switch
        {
            DealStage.NEW => 10,
            DealStage.IN_PROGRESS => 40,
            DealStage.NEGOTIATION => 70,
            _ => deal.Probability
        };
        deal.UpdatedAt = DateTime.UtcNow;

        await _dealRepo.UpdateAsync(deal);
        return MapToDealResponse(deal, deal.Doctor?.Name ?? "");
    }

    private bool IsValidTransition(DealStage from, DealStage to)
    {
        var order = new[] { DealStage.NEW, DealStage.IN_PROGRESS, DealStage.NEGOTIATION };
        var fromIdx = Array.IndexOf(order, from);
        var toIdx = Array.IndexOf(order, to);

        if (from == DealStage.LOST) return true; // LOST can go back to any stage

        // Linear: can go forward one step, or to LOST
        if (to == DealStage.LOST) return true;

        // Forward one step
        return toIdx == fromIdx + 1;
    }

    private async Task<bool> HasRecentActivityAsync(Guid doctorId, int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        var activities = await _context.Activities
            .Where(a => a.DoctorId == doctorId
                && a.CreatedAt >= cutoff
                && (a.Type == ActivityType.CALL || a.Type == ActivityType.MEETING))
            .AnyAsync();
        return activities;
    }

    private DealResponse MapToDealResponse(Deal deal, string doctorName)
    {
        return new DealResponse
        {
            Id = deal.Id,
            DoctorId = deal.DoctorId,
            DoctorName = doctorName,
            SalesId = deal.SalesId,
            SalesName = deal.Sales?.Name ?? "",
            Product = deal.Product.ToString(),
            Quantity = deal.Quantity,
            UnitPrice = deal.UnitPrice,
            TotalValue = deal.TotalValue,
            Stage = deal.Stage.ToString(),
            Probability = deal.Probability,
            ExpectedCloseDate = deal.ExpectedCloseDate,
            Notes = deal.Notes,
            CreatedAt = deal.CreatedAt,
            UpdatedAt = deal.UpdatedAt
        };
    }
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Services/DealService.cs
git commit -m "feat(deals): add DealService"
```

---

### Task 8: Create DealsController

**Files:**
- Create: `backend/Controllers/DealsController.cs`

- [ ] **Step 1: Read existing controller pattern**

Run: `Read backend/Controllers/DoctorsController.cs`
Expected: Shows endpoint pattern, auth, DI

- [ ] **Step 2: Create DealsController.cs**

Create `backend/Controllers/DealsController.cs`:

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DealsController : ControllerBase
{
    private readonly IDealService _dealService;

    public DealsController(IDealService dealService)
    {
        _dealService = dealService;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpPost]
    public async Task<ActionResult<DealResponse>> CreateDeal([FromBody] CreateDealRequest request)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var deal = await _dealService.CreateDealAsync(request, salesId);
            return CreatedAtAction(nameof(GetDeal), new { id = deal.Id }, deal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DealResponse>> GetDeal(Guid id)
    {
        var deal = await _dealService.GetDealByIdAsync(id);
        if (deal == null) return NotFound();
        return Ok(deal);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DealResponse>> UpdateDeal(Guid id, [FromBody] UpdateDealRequest request)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            var deal = await _dealService.UpdateDealAsync(id, request, salesId, role);
            if (deal == null) return NotFound();
            return Ok(deal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDeal(Guid id)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            var result = await _dealService.DeleteDealAsync(id, salesId, role);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("pipeline")]
    public async Task<ActionResult<PipelineResponse>> GetPipeline([FromQuery] Guid? managerId)
    {
        var role = GetCurrentUserRole();
        var userId = GetCurrentUserId();
        var result = await _dealService.GetPipelineAsync(managerId, role, userId);
        return Ok(result);
    }

    [HttpGet("forecast")]
    public async Task<ActionResult<ForecastResponse>> GetForecast()
    {
        var result = await _dealService.GetForecastAsync();
        return Ok(result);
    }

    [HttpPut("{id}/stage")]
    public async Task<ActionResult<DealResponse>> UpdateStage(Guid id, [FromBody] UpdateStageRequest request)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            var deal = await _dealService.UpdateStageAsync(id, request, salesId, role);
            if (deal == null) return NotFound();
            return Ok(deal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Controllers/DealsController.cs
git commit -m "feat(deals): add DealsController with CRUD and pipeline endpoints"
```

---

### Task 9: Register Deal Dependencies in Program.cs

**Files:**
- Modify: `backend/Program.cs`

- [ ] **Step 1: Read Program.cs to find DI registration section**

Run: `Read backend/Program.cs`
Expected: Shows services.AddScoped, repositories.AddScoped calls

- [ ] **Step 2: Add Deal service and repository DI**

Add to the DI section (after existing service registrations):
```csharp
// Deal
builder.Services.AddScoped<IDealRepository, DealRepository>();
builder.Services.AddScoped<IDealService, DealService>();
```

- [ ] **Step 3: Verify build**

Run: `cd backend; dotnet build`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add backend/Program.cs
git commit -m "feat(deals): register DealService and DealRepository in DI"
```

---

### Task 10: Update Database (Recreate with New Schema)

**Files:**
- Delete: `backend/salesystem.db`

- [ ] **Step 1: Delete and rebuild**

Run: `rm backend/salesystem.db -ErrorAction SilentlyContinue; cd backend; dotnet build`

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: recreate database with Deal fields"
```

---

## Frontend Tasks

### Task 11: Add Deal Types to types/index.ts

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Read existing types**

Run: `Read frontend/src/types/index.ts`
Expected: Shows existing interfaces (User, Doctor, Hospital, etc.)

- [ ] **Step 2: Add Deal types**

Add to the types file:

```typescript
// Deal types
export type DealStage = 'NEW' | 'IN_PROGRESS' | 'NEGOTIATION' | 'WON' | 'LOST';
export type ProductType = 'SILICONE' | 'CREAM';

export interface Deal {
  id: string;
  doctorId: string;
  doctorName: string;
  salesId: string;
  salesName: string;
  product: ProductType;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealRequest {
  doctorId: string;
  product: ProductType;
  quantity: number;
  unitPrice: number;
  expectedCloseDate?: string;
  notes?: string;
}

export interface UpdateDealRequest {
  product?: ProductType;
  quantity?: number;
  unitPrice?: number;
  expectedCloseDate?: string;
  notes?: string;
}

export interface UpdateStageRequest {
  stage: DealStage;
}

export interface PipelineResponse {
  stages: Record<DealStage, Deal[]>;
}

export interface ForecastStageItem {
  stage: DealStage;
  count: number;
  totalValue: number;
  weightedValue: number;
}

export interface ForecastResponse {
  stages: ForecastStageItem[];
  totalPipelineValue: number;
  weightedForecast: number;
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(deals): add Deal types to frontend"
```

---

### Task 12: Create dealService.ts

**Files:**
- Create: `frontend/src/services/dealService.ts`

- [ ] **Step 1: Read existing service pattern**

Run: `Read frontend/src/services/hospitalService.ts`
Expected: Shows CRUD pattern with api calls

- [ ] **Step 2: Create dealService.ts**

Create `frontend/src/services/dealService.ts`:

```typescript
import api from './api';
import {
  Deal,
  CreateDealRequest,
  UpdateDealRequest,
  UpdateStageRequest,
  PipelineResponse,
  ForecastResponse,
} from '../types';

export const dealService = {
  createDeal: async (data: CreateDealRequest): Promise<Deal> => {
    const response = await api.post('/deals', data);
    return response.data;
  },

  getDeal: async (id: string): Promise<Deal> => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },

  updateDeal: async (id: string, data: UpdateDealRequest): Promise<Deal> => {
    const response = await api.put(`/deals/${id}`, data);
    return response.data;
  },

  deleteDeal: async (id: string): Promise<void> => {
    await api.delete(`/deals/${id}`);
  },

  getPipeline: async (): Promise<PipelineResponse> => {
    const response = await api.get('/deals/pipeline');
    return response.data;
  },

  getForecast: async (): Promise<ForecastResponse> => {
    const response = await api.get('/deals/forecast');
    return response.data;
  },

  updateStage: async (id: string, stage: string): Promise<Deal> => {
    const response = await api.put(`/deals/${id}/stage`, { stage });
    return response.data;
  },
};
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/dealService.ts
git commit -m "feat(deals): add dealService with pipeline and forecast APIs"
```

---

### Task 13: Create DealCard Component

**Files:**
- Create: `frontend/src/components/deals/DealCard.tsx`

- [ ] **Step 1: Create components/deals directory**

Run: `mkdir -p frontend/src/components/deals` (already exists if prior work done)

- [ ] **Step 2: Create DealCard.tsx**

Create `frontend/src/components/deals/DealCard.tsx`:

```tsx
import { Deal } from '../../types';

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onClick, isDragging }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isLocked = deal.stage === 'WON' || deal.stage === 'LOST';

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-slate-200 p-3 cursor-pointer
        hover:shadow-md transition-shadow
        ${isDragging ? 'shadow-xl rotate-2' : ''}
        ${isLocked ? 'opacity-75' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{deal.doctorName}</p>
          <p className="text-sm font-semibold text-slate-700 mt-1">
            {formatCurrency(deal.totalValue)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>{formatDate(deal.expectedCloseDate)}</span>
            <span>·</span>
            <span>{deal.probability}%</span>
          </div>
        </div>
        {isLocked && (
          <div className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
            {deal.stage === 'WON' ? '✓ Won' : '✗ Lost'}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/deals/DealCard.tsx
git commit -m "feat(deals): add DealCard component"
```

---

### Task 14: Create AddDealModal

**Files:**
- Create: `frontend/src/components/deals/AddDealModal.tsx`

- [ ] **Step 1: Check existing modal pattern**

Run: `Read frontend/src/components/common/Modal.tsx`
Expected: Shows modal component interface

- [ ] **Step 2: Create AddDealModal.tsx**

Create `frontend/src/components/deals/AddDealModal.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { doctorService, type Doctor } from '../../services/doctorService';
import { dealService, type CreateDealRequest } from '../../services/dealService';
import { X } from 'lucide-react';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDealModal: React.FC<AddDealModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    doctorId: '',
    product: 'SILICONE' as 'SILICONE' | 'CREAM',
    quantity: 1,
    unitPrice: 0,
    expectedCloseDate: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadDoctors();
    }
  }, [isOpen]);

  const loadDoctors = async () => {
    try {
      const data = await doctorService.getDoctors();
      setDoctors(data.items);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorId || form.quantity <= 0 || form.unitPrice <= 0) return;

    setLoading(true);
    try {
      const request: CreateDealRequest = {
        doctorId: form.doctorId,
        product: form.product,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        expectedCloseDate: form.expectedCloseDate || undefined,
        notes: form.notes || undefined,
      };
      await dealService.createDeal(request);
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to create deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      doctorId: '',
      product: 'SILICONE',
      quantity: 1,
      unitPrice: 0,
      expectedCloseDate: '',
      notes: '',
    });
  };

  const totalValue = form.quantity * form.unitPrice;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Add New Deal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
            <select
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value as 'SILICONE' | 'CREAM' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="SILICONE">SILICONE</option>
              <option value="CREAM">CREAM</option>
            </select>
          </div>

          {/* Quantity + Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (VND)</label>
              <input
                type="number"
                min="0"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Total Value Display */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-sm text-slate-600">Total Value: </span>
            <span className="text-lg font-semibold text-slate-800">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(totalValue)}
            </span>
          </div>

          {/* Expected Close Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close Date</label>
            <input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Deal</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/deals/AddDealModal.tsx
git commit -m "feat(deals): add AddDealModal component"
```

---

### Task 15: Create DealDetailDrawer

**Files:**
- Create: `frontend/src/components/deals/DealDetailDrawer.tsx`

- [ ] **Step 1: Create DealDetailDrawer.tsx**

Create `frontend/src/components/deals/DealDetailDrawer.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { Drawer } from '../common/Drawer'; // Note: verify if Drawer component exists, if not use Modal
import { Button } from '../common/Button';
import { dealService, type Deal, type UpdateDealRequest } from '../../services/dealService';
import { X, Lock } from 'lucide-react';

interface DealDetailDrawerProps {
  dealId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const DealDetailDrawer: React.FC<DealDetailDrawerProps> = ({ dealId, isOpen, onClose, onUpdate }) => {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dealId && isOpen) {
      loadDeal();
    }
  }, [dealId, isOpen]);

  const loadDeal = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const data = await dealService.getDeal(dealId);
      setDeal(data);
    } catch (error) {
      console.error('Failed to load deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!deal) return;
    setSaving(true);
    try {
      const request: UpdateDealRequest = {
        product: deal.product as 'SILICONE' | 'CREAM',
        quantity: deal.quantity,
        unitPrice: deal.unitPrice,
        expectedCloseDate: deal.expectedCloseDate || undefined,
        notes: deal.notes || undefined,
      };
      await dealService.updateDeal(deal.id, request);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update deal:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!deal) return null;

  const isLocked = deal.stage === 'WON' || deal.stage === 'LOST';

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Deal Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isLocked && (
              <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg mb-6">
                <Lock className="w-4 h-4" />
                <span className="text-sm">This deal is locked ({deal.stage})</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                <p className="text-slate-800">{deal.doctorName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                  <select
                    value={deal.product}
                    onChange={(e) => setDeal({ ...deal, product: e.target.value as 'SILICONE' | 'CREAM' })}
                    disabled={isLocked}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  >
                    <option value="SILICONE">SILICONE</option>
                    <option value="CREAM">CREAM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                  <p className="text-slate-800">{deal.stage}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={deal.quantity}
                    onChange={(e) => setDeal({ ...deal, quantity: parseInt(e.target.value) || 0 })}
                    disabled={isLocked}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    value={deal.unitPrice}
                    onChange={(e) => setDeal({ ...deal, unitPrice: parseInt(e.target.value) || 0 })}
                    disabled={isLocked}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="text-sm text-slate-600">Total Value: </span>
                <span className="text-lg font-semibold text-slate-800">
                  {formatCurrency(deal.totalValue)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Close</label>
                <input
                  type="date"
                  value={deal.expectedCloseDate || ''}
                  onChange={(e) => setDeal({ ...deal, expectedCloseDate: e.target.value || null })}
                  disabled={isLocked}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={deal.notes || ''}
                  onChange={(e) => setDeal({ ...deal, notes: e.target.value })}
                  disabled={isLocked}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                {!isLocked && (
                  <Button onClick={handleSave} loading={saving}>Save Changes</Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
};
```

Note: If `Drawer` component doesn't exist in the codebase, replace `<Drawer>` with `<Modal>` and adjust accordingly.

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors (may need to adjust if Drawer doesn't exist)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/deals/DealDetailDrawer.tsx
git commit -m "feat(deals): add DealDetailDrawer component"
```

---

### Task 16: Create Deals.tsx Page (Kanban Board)

**Files:**
- Create: `frontend/src/pages/Deals.tsx`

- [ ] **Step 1: Create Deals.tsx**

Create `frontend/src/pages/Deals.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { dealService, type Deal, type DealStage } from '../services/dealService';
import { DealCard } from '../components/deals/DealCard';
import { AddDealModal } from '../components/deals/AddDealModal';
import { DealDetailDrawer } from '../components/deals/DealDetailDrawer';
import { Button } from '../components/common/Button';
import { Plus, BarChart3 } from 'lucide-react';

const STAGES: DealStage[] = ['NEW', 'IN_PROGRESS', 'NEGOTIATION', 'WON', 'LOST'];

const STAGE_LABELS: Record<DealStage, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

export const Deals: React.FC = () => {
  const [pipeline, setPipeline] = useState<Record<DealStage, Deal[]>>({
    NEW: [],
    IN_PROGRESS: [],
    NEGOTIATION: [],
    WON: [],
    LOST: [],
  });
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailDrawerId, setDetailDrawerId] = useState<string | null>(null);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    try {
      const data = await dealService.getPipeline();
      setPipeline(data.stages);
    } catch (error) {
      console.error('Failed to load pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStage = destination.droppableId as DealStage;
    const dealId = draggableId;

    // Find current stage of the deal
    let currentStage: DealStage | null = null;
    for (const [stage, deals] of Object.entries(pipeline)) {
      if (deals.some(d => d.id === dealId)) {
        currentStage = stage as DealStage;
        break;
      }
    }

    if (!currentStage || currentStage === newStage) return;

    // Don't allow dragging out of WON/LOST
    if (currentStage === 'WON' || currentStage === 'LOST') return;

    // Don't allow dragging to WON/LOST directly (must go through NEGOTIATION)
    if (newStage === 'WON' || newStage === 'LOST') {
      if (currentStage !== 'NEGOTIATION') return;
    }

    try {
      await dealService.updateStage(dealId, newStage);
      loadPipeline();
    } catch (error) {
      console.error('Failed to update stage:', error);
      alert('Failed to move deal: ' + (error as Error).message);
    }
  };

  const handleCardClick = (dealId: string) => {
    setDetailDrawerId(dealId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Deals Pipeline</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="flex-shrink-0 w-72"
              >
                <div className="bg-slate-100 rounded-t-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{STAGE_LABELS[stage]}</span>
                    <span className="text-sm text-slate-500">{pipeline[stage].length}</span>
                  </div>
                </div>
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        bg-slate-50 rounded-b-lg p-2 min-h-[200px] space-y-2
                        ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
                      `}
                    >
                      {pipeline[stage].map((deal, index) => (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id}
                          index={index}
                          isDragDisabled={stage === 'WON' || stage === 'LOST'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <DealCard
                                deal={deal}
                                onClick={() => handleCardClick(deal.id)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadPipeline}
      />

      {/* Deal Detail Drawer */}
      <DealDetailDrawer
        dealId={detailDrawerId}
        isOpen={detailDrawerId !== null}
        onClose={() => setDetailDrawerId(null)}
        onUpdate={loadPipeline}
      />
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Deals.tsx
git commit -m "feat(deals): add Deals page with Kanban board"
```

---

### Task 17: Add Deals Route to App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Read App.tsx**

Run: `Read frontend/src/App.tsx`
Expected: Shows React Router setup with lazy loading

- [ ] **Step 2: Add Deals route**

Add the Deals import and route:
```tsx
const Deals = lazy(() => import('./pages/Deals').then(m => ({ default: m.Deals })));

// Add route inside the protected routes:
<Route path="deals" element={<Deals />} />
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(deals): add Deals route to App.tsx"
```

---

### Task 18: Add Deals Menu Item

**Files:**
- Modify: `frontend/src/navigation/menuConfig.tsx`

- [ ] **Step 1: Read menuConfig.tsx**

Run: `Read frontend/src/navigation/menuConfig.tsx`
Expected: Shows menu structure with icons and roles

- [ ] **Step 2: Add Deals menu item**

Add to MAIN section (import `Briefcase` from lucide-react):
```tsx
{ label: 'Deals', path: '/deals', icon: <Briefcase className="w-5 h-5" />, roles: ['Admin', 'SalesManager', 'SalesMember'] },
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/navigation/menuConfig.tsx
git commit -m "feat(deals): add Deals menu item"
```

---

### Task 19: Add Pipeline Widget to Dashboard

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Read Dashboard.tsx**

Run: `Read frontend/src/pages/Dashboard.tsx`
Expected: Shows dashboard with stats and cards

- [ ] **Step 2: Add pipeline forecast widget**

Add the pipeline widget to Dashboard (fetch forecast data, display summary card):
```tsx
// Add to imports:
import { dealService } from '../services/dealService';

// Add state and useEffect to fetch forecast
const [forecast, setForecast] = useState<{ totalPipelineValue: number; weightedForecast: number } | null>(null);

useEffect(() => {
  loadForecast();
}, []);

const loadForecast = async () => {
  try {
    const data = await dealService.getForecast();
    setForecast({
      totalPipelineValue: data.totalPipelineValue,
      weightedForecast: data.weightedForecast,
    });
  } catch (error) {
    console.error('Failed to load forecast:', error);
  }
};

// Add pipeline card to the stats grid
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
  <div className="text-sm text-slate-500 mb-1">Pipeline Value</div>
  <div className="text-2xl font-bold text-slate-800">
    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(forecast?.totalPipelineValue || 0)}
  </div>
  <div className="text-xs text-slate-500 mt-1">
    Weighted: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(forecast?.weightedForecast || 0)}
  </div>
</div>
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend; npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat(deals): add pipeline forecast widget to Dashboard"
```

---

### Task 20: Install @hello-pangea/dnd

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install dependency**

Run: `cd frontend; npm install @hello-pangea/dnd`

- [ ] **Step 2: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat(deals): install @hello-pangea/dnd for Kanban board"
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

3. **Test the API:**
   - Start backend: `cd backend; dotnet run`
   - Start frontend: `cd frontend; npm run dev`
   - Navigate to `/deals` - should see empty Kanban board
   - Create a deal - should appear in NEW column

---

## Self-Review Checklist

- [ ] All spec requirements covered by tasks?
- [ ] No TBD/TODO placeholders?
- [ ] Types consistent across tasks?
- [ ] All builds pass?
- [ ] Deferred items noted (Engagement Board, Priority scoring, Manager team view)?