# Doctor & Hospital Modules Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance Doctor & Hospital modules with composite indexes, phone validation, proper HTTP status codes, and fix service layer to use optimized repository.

**Architecture:** Incremental enhancement — fix bugs and add validation without changing the existing layered structure (Controller → Service → Repository). Use Entity Framework Core for SQLite index configuration and DataAnnotations for validation.

**Tech Stack:** ASP.NET Core 8, Entity Framework Core, SQLite, System.ComponentModel.DataAnnotations

---

## File Map

| File | Responsibility |
|------|----------------|
| `backend/Data/AppDbContext.cs` | Composite index definitions for Doctor entity |
| `backend/DTOs/Request/CreateDoctorRequest.cs` | Add phone regex validation |
| `backend/DTOs/Request/UpdateDoctorRequest.cs` | Add phone regex validation |
| `backend/Services/DoctorService.cs` | Use IDoctorRepository instead of generic IRepository |
| `backend/Services/DoctorService.cs` | Return 409 Conflict for duplicate phone |

---

## Tasks

### Task 1: Add Composite Indexes to AppDbContext

**Files:**
- Modify: `backend/Data/AppDbContext.cs:57-69`

- [ ] **Step 1: Add composite index for HospitalId + PotentialLevel**

```csharp
modelBuilder.Entity<Doctor>()
    .HasIndex(d => new { d.HospitalId, d.PotentialLevel });
```

- [ ] **Step 2: Add index for AssignedSalesId**

```csharp
modelBuilder.Entity<Doctor>()
    .HasIndex(d => d.AssignedSalesId);
```

- [ ] **Step 3: Add index for CreatedAt (explicit ordering index)**

```csharp
modelBuilder.Entity<Doctor>()
    .HasIndex(d => d.CreatedAt);
```

- [ ] **Step 4: Verify build succeeds**

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

### Task 2: Add Phone Regex Validation

**Files:**
- Modify: `backend/DTOs/Request/CreateDoctorRequest.cs:14-16`
- Modify: `backend/DTOs/Request/UpdateDoctorRequest.cs:14-16`

- [ ] **Step 1: Add RegularExpression using to CreateDoctorRequest**

```csharp
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
```

- [ ] **Step 2: Add phone regex validation to CreateDoctorRequest**

```csharp
[Required]
[MaxLength(20)]
[RegularExpression(@"^(0[0-9]{9,10})$", ErrorMessage = "Invalid Vietnamese phone number (09x/03x/07x/08x)")]
public string Phone { get; set; }
```

- [ ] **Step 3: Add phone regex validation to UpdateDoctorRequest**

```csharp
[Required]
[MaxLength(20)]
[RegularExpression(@"^(0[0-9]{9,10})$", ErrorMessage = "Invalid Vietnamese phone number (09x/03x/07x/08x)")]
public string Phone { get; set; }
```

- [ ] **Step 4: Verify build succeeds**

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

### Task 3: Return 409 Conflict for Duplicate Phone

**Files:**
- Modify: `backend/Services/DoctorService.cs:71-77`
- Modify: `backend/Services/DoctorService.cs:124-128`

- [ ] **Step 1: Add Microsoft.EntityFrameworkCore using if not present**

```csharp
using Microsoft.EntityFrameworkCore;
```

- [ ] **Step 2: Change CreateDoctorAsync duplicate phone handling to return 409**

Find this code:
```csharp
catch (InvalidOperationException ex)
{
    return BadRequest(new { message = ex.Message });
}
```

Replace with:
```csharp
catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
{
    return Conflict(new { message = ex.Message });
}
catch (InvalidOperationException ex)
{
    return BadRequest(new { message = ex.Message });
}
```

- [ ] **Step 3: Change UpdateDoctorAsync duplicate phone handling to return 409**

Find this code:
```csharp
catch (InvalidOperationException ex)
{
    return BadRequest(new { message = ex.Message });
}
```

Replace with:
```csharp
catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
{
    return Conflict(new { message = ex.Message });
}
catch (InvalidOperationException ex)
{
    return BadRequest(new { message = ex.Message });
}
```

- [ ] **Step 4: Verify build succeeds**

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

### Task 4: Fix DoctorService to Use IDoctorRepository

**Files:**
- Modify: `backend/Services/DoctorService.cs:10-19`
- Modify: `backend/Services/DoctorService.cs:21-53`
- Modify: `backend/Services/DoctorService.cs:56-68`
- Modify: `backend/Services/DoctorService.cs:144-165`
- Modify: `backend/Services/DoctorService.cs:167-180`

- [ ] **Step 1: Update constructor to accept IDoctorRepository instead of IRepository<Doctor>**

Change from:
```csharp
private readonly IRepository<Doctor> _doctorRepository;
private readonly AppDbContext _context;

public DoctorService(IRepository<Doctor> doctorRepository, AppDbContext context)
{
    _doctorRepository = doctorRepository;
    _context = context;
}
```

To:
```csharp
private readonly IDoctorRepository _doctorRepository;

public DoctorService(IDoctorRepository doctorRepository)
{
    _doctorRepository = doctorRepository;
}
```

- [ ] **Step 2: Update GetDoctorsAsync to use IDoctorRepository**

Change from:
```csharp
var totalCount = await query.CountAsync();

var doctors = await query
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

To:
```csharp
var doctors = await _doctorRepository.GetAllWithDetailsAsync(page, pageSize, search, potentialLevel, hospitalId);
var totalCount = await _doctorRepository.GetTotalCountAsync(search, potentialLevel, hospitalId);
```

- [ ] **Step 3: Update GetDoctorByIdAsync to use IDoctorRepository**

Change from:
```csharp
var doctor = await _context.Doctors
    .Include(d => d.Hospital)
    .Include(d => d.AssignedSales)
    .FirstOrDefaultAsync(d => d.Id == id);
```

To:
```csharp
var doctor = await _doctorRepository.GetByIdWithDetailsAsync(id);
```

- [ ] **Step 4: Update GetAssignedDoctorsAsync to use IDoctorRepository**

Change from:
```csharp
var doctors = await _context.Doctors
    .Include(d => d.Hospital)
    .Include(d => d.AssignedSales)
    .Where(d => d.AssignedSalesId == salesId)
    .ToListAsync();
```

To:
```csharp
var doctors = await _doctorRepository.GetByAssignedSalesIdAsync(salesId);
```

- [ ] **Step 5: Update AssignDoctorToSalesAsync to use IDoctorRepository**

Change from:
```csharp
var doctor = await _doctorRepository.GetByIdAsync(doctorId);
if (doctor == null)
{
    return false;
}
```

To:
```csharp
var doctor = await _doctorRepository.GetByIdAsync(doctorId);
if (doctor == null)
{
    return false;
}
```

- [ ] **Step 6: Verify build succeeds**

Run: `dotnet build`
Expected: 0 Warning(s), 0 Error(s)

---

### Task 5: Verify Complete Functionality

- [ ] **Step 1: Delete old database to apply new indexes**

Run: `Remove-Item "C:\Data\StartUp\SaleManagerSystem\backend\salesystem.db" -Force -ErrorAction SilentlyContinue`

- [ ] **Step 2: Start server and test login**

Run: `Start-Process -FilePath "backend\bin\Debug\net8.0\SalesSystem.exe" ...; sleep 3; Invoke-RestMethod ...`

- [ ] **Step 3: Test GET /doctors with pagination**

Expected: Returns paginated list with HospitalName and AssignedSalesName

- [ ] **Step 4: Test POST /doctors with valid phone (09x)**

Expected: 201 Created

- [ ] **Step 5: Test POST /doctors with invalid phone format**

Expected: 400 BadRequest with validation message

- [ ] **Step 6: Test POST /doctors with duplicate phone**

Expected: 409 Conflict

- [ ] **Step 7: Test PUT /doctors/{id} with duplicate phone**

Expected: 409 Conflict

---

## Completion Criteria

- [ ] Build succeeds with 0 warnings, 0 errors
- [ ] Composite indexes added to AppDbContext
- [ ] Phone regex validation on CreateDoctorRequest and UpdateDoctorRequest
- [ ] Duplicate phone returns 409 Conflict (not 400)
- [ ] DoctorService uses IDoctorRepository (not generic IRepository)
- [ ] All API endpoints functional
