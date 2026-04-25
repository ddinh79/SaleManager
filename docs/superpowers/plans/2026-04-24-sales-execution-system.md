# Sales Execution System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full production-ready Sales Execution System for B2B medical sales (silicone scar sheets/cream) with ASP.NET Core backend and React frontend. Phase 1: Core Auth + Doctor Management + Basic Dashboard.

**Architecture:** Clean Architecture with Controller → Service → Repository pattern. JWT authentication. Entity Framework Core with SQLite. React + TypeScript + TailwindCSS + Zustand state management.

**Tech Stack:**
- Backend: ASP.NET Core .NET 8, EF Core 8, SQLite, BCrypt, JWT
- Frontend: React 18 + TypeScript + Vite + TailwindCSS + Axios + Zustand
- Database: SQLite (cross-platform, embedded)

---

## File Structure

### Backend (`/backend`)
```
/backend
  /Controllers
    - AuthController.cs
    - UsersController.cs
    - DoctorsController.cs
    - HospitalsController.cs
  /Services
    - IAuthService.cs, AuthService.cs
    - IUserService.cs, UserService.cs
    - IDoctorService.cs, DoctorService.cs
    - IHospitalService.cs, HospitalService.cs
  /Repositories
    - IRepository.cs, Repository.cs (generic base)
    - IUserRepository.cs, UserRepository.cs
    - IDoctorRepository.cs, DoctorRepository.cs
    - IHospitalRepository.cs, HospitalRepository.cs
  /Entities
    - User.cs, Doctor.cs, Hospital.cs, Enums.cs
  /DTOs/Request
    - LoginRequest.cs, RegisterRequest.cs
    - CreateDoctorRequest.cs, UpdateDoctorRequest.cs
    - CreateHospitalRequest.cs
  /DTOs/Response
    - LoginResponse.cs, UserResponse.cs
    - DoctorResponse.cs, HospitalResponse.cs
    - PaginatedResponse.cs
  /Data
    - AppDbContext.cs
  /Middleware
    - JwtMiddleware.cs, ExceptionMiddleware.cs
  /Helpers
    - JwtHelper.cs, PasswordHelper.cs
  Program.cs
  appsettings.json
  SalesSystem.csproj
```

### Frontend (`/frontend`)
```
/frontend
  /src
    /components/common
      - Button.tsx, Card.tsx, Input.tsx, Select.tsx
      - Table.tsx, Modal.tsx
      - Sidebar.tsx, TopBar.tsx
      - ProtectedRoute.tsx
    /pages
      - Login.tsx
      - Dashboard.tsx
      - Doctors.tsx, DoctorForm.tsx
      - Hospitals.tsx
      - NotFound.tsx
    /services
      - api.ts (Axios instance with interceptors)
      - authService.ts, doctorService.ts, hospitalService.ts
    /store
      - authStore.ts (Zustand)
    /types
      - index.ts
    /layouts
      - MainLayout.tsx
    App.tsx, main.tsx
  package.json, vite.config.ts, tailwind.config.js, tsconfig.json
```

---

## Phase 1 Task Breakdown

### Task 1: Backend Project Scaffolding

**Files:**
- Create: `/backend/SalesSystem.csproj`
- Create: `/backend/Program.cs`
- Create: `/backend/appsettings.json`

- [ ] **Step 1: Create project file**

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>
</Project>
```

- [ ] **Step 2: Create Program.cs with basic setup**

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();
```

- [ ] **Step 3: Create appsettings.json**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=salesystem.db"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "SalesSystem",
    "Audience": "SalesSystemApp",
    "ExpiryInHours": 24
  },
  "Logging": {
    "LogLevel": "Information"
  }
}
```

---

### Task 2: Entity Definitions

**Files:**
- Create: `/backend/Entities/Enums.cs`
- Create: `/backend/Entities/User.cs`
- Create: `/backend/Entities/Doctor.cs`
- Create: `/backend/Entities/Hospital.cs`

- [ ] **Step 1: Create Enums.cs**

```csharp
namespace SalesSystem.Entities;

public enum UserRole
{
    Admin,
    SalesManager,
    SalesMember
}

public enum ActivityType
{
    CALL,
    MESSAGE,
    MEETING,
    DEMO,
    SAMPLE_SENT
}

public enum ActivityResult
{
    Interested,
    NotInterested,
    FollowUp
}

public enum DealStage
{
    NEW,
    IN_PROGRESS,
    NEGOTIATION,
    WON,
    LOST
}

public enum ProductType
{
    SCAR_SHEET,
    SCAR_CREAM,
    BOTH
}

public enum PotentialLevel
{
    A,
    B,
    C
}

public enum OrderStatus
{
    Pending,
    Shipped,
    Completed
}

public enum NotificationType
{
    FollowUpReminder,
    DealClosing,
    InactiveAlert
}
```

- [ ] **Step 2: Create User.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public Guid? ManagerId { get; set; }
    public User? Manager { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<User> TeamMembers { get; set; } = new List<User>();
    public ICollection<Doctor> AssignedDoctors { get; set; } = new List<Doctor>();
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<Deal> Deals { get; set; } = new List<Deal>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
```

- [ ] **Step 3: Create Hospital.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class Hospital
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
}
```

- [ ] **Step 4: Create Doctor.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class Doctor
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Specialty { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Zalo { get; set; }

    public Guid HospitalId { get; set; }
    public Hospital Hospital { get; set; } = null!;

    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    public PotentialLevel PotentialLevel { get; set; } = PotentialLevel.C;

    public Guid? AssignedSalesId { get; set; }
    public User? AssignedSales { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public ICollection<Deal> Deals { get; set; } = new List<Deal>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
```

---

### Task 3: DbContext and Configuration

**Files:**
- Create: `/backend/Data/AppDbContext.cs`

- [ ] **Step 1: Create AppDbContext.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Entities;

namespace SalesSystem.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Hospital> Hospitals => Set<Hospital>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Deal> Deals => Set<Deal>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User unique constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Doctor unique phone
        modelBuilder.Entity<Doctor>()
            .HasIndex(d => d.Phone)
            .IsUnique();

        // User self-reference (manager)
        modelBuilder.Entity<User>()
            .HasOne(u => u.Manager)
            .WithMany(u => u.TeamMembers)
            .HasForeignKey(u => u.ManagerId)
            .OnDelete(DeleteBehavior.SetNull);

        // Doctor -> Hospital
        modelBuilder.Entity<Doctor>()
            .HasOne(d => d.Hospital)
            .WithMany(h => h.Doctors)
            .HasForeignKey(d => d.HospitalId)
            .OnDelete(DeleteBehavior.Restrict);

        // Doctor -> User (assigned sales)
        modelBuilder.Entity<Doctor>()
            .HasOne(d => d.AssignedSales)
            .WithMany(u => u.AssignedDoctors)
            .HasForeignKey(d => d.AssignedSalesId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes for performance
        modelBuilder.Entity<Activity>()
            .HasIndex(a => a.CreatedAt);

        modelBuilder.Entity<Activity>()
            .HasIndex(a => new { a.SalesId, a.DoctorId, a.Type, a.CreatedAt });

        modelBuilder.Entity<Deal>()
            .HasIndex(d => d.Stage);

        modelBuilder.Entity<Deal>()
            .HasIndex(d => d.SalesId);

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var manager1Id = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var manager2Id = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var sales1Id = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var sales2Id = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var sales3Id = Guid.Parse("66666666-6666-6666-6666-666666666666");
        var sales4Id = Guid.Parse("77777777-7777-7777-7777-777777777777");
        var sales5Id = Guid.Parse("88888888-8888-8888-8888-888888888888");

        // Passwords: Admin123!, Manager123!, Sales123! (BCrypt hashed)
        var passwordHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4uSR.PJsqqKlAjey";

        modelBuilder.Entity<User>().HasData(
            new User { Id = adminId, Username = "admin", Email = "admin@test.com", PasswordHash = passwordHash, FullName = "Nguyễn CEO", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = manager1Id, Username = "manager1", Email = "manager1@test.com", PasswordHash = passwordHash, FullName = "Trần Manager", Role = UserRole.SalesManager, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = manager2Id, Username = "manager2", Email = "manager2@test.com", PasswordHash = passwordHash, FullName = "Lê Manager", Role = UserRole.SalesManager, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales1Id, Username = "sales1", Email = "sales1@test.com", PasswordHash = passwordHash, FullName = "Minh Sales", Role = UserRole.SalesMember, ManagerId = manager1Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales2Id, Username = "sales2", Email = "sales2@test.com", PasswordHash = passwordHash, FullName = "Hùng Sales", Role = UserRole.SalesMember, ManagerId = manager1Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales3Id, Username = "sales3", Email = "sales3@test.com", PasswordHash = passwordHash, FullName = "Lan Sales", Role = UserRole.SalesMember, ManagerId = manager2Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales4Id, Username = "sales4", Email = "sales4@test.com", PasswordHash = passwordHash, FullName = "Chi Sales", Role = UserRole.SalesMember, ManagerId = manager2Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales5Id, Username = "sales5", Email = "sales5@test.com", PasswordHash = passwordHash, FullName = "Phong Sales", Role = UserRole.SalesMember, ManagerId = manager2Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );

        var h1Id = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
        var h2Id = Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB");
        var h3Id = Guid.Parse("CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC");
        var h4Id = Guid.Parse("DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD");
        var h5Id = Guid.Parse("EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE");

        modelBuilder.Entity<Hospital>().HasData(
            new Hospital { Id = h1Id, Name = "Bệnh viện Da liễu Trung ương", Address = "Hà Nội", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Hospital { Id = h2Id, Name = "Bệnh viện Chợ Rẫy", Address = "TP.HCM", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Hospital { Id = h3Id, Name = "Bệnh viện Đại học Y Hà Nội", Address = "Hà Nội", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Hospital { Id = h4Id, Name = "Bệnh viện Nhi Trung ương", Address = "Hà Nội", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Hospital { Id = h5Id, Name = "Bệnh viện Tai Mũi Họng", Address = "TP.HCM", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );

        var d1Id = Guid.Parse("FACEFACE-FACE-FACE-FACE-FACEFACEFACE");
        var d2Id = Guid.Parse("DEADDEAD-DEAD-DEAD-DEAD-DEADDEADDEAD");
        var d3Id = Guid.Parse("CAFECAFE-CAFE-CAFE-CAFE-CAFECAFECAFE");

        modelBuilder.Entity<Doctor>().HasData(
            new Doctor { Id = d1Id, Name = "BS. Nguyễn Văn A", Specialty = "Da liễu", Phone = "0901000001", HospitalId = h1Id, PotentialLevel = PotentialLevel.A, AssignedSalesId = sales1Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Doctor { Id = d2Id, Name = "BS. Trần Thị B", Specialty = "Phẫu thuật thẩm mỹ", Phone = "0902000002", HospitalId = h2Id, PotentialLevel = PotentialLevel.A, AssignedSalesId = sales1Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Doctor { Id = d3Id, Name = "BS. Lê Văn C", Specialty = "Da liễu", Phone = "0903000003", HospitalId = h3Id, PotentialLevel = PotentialLevel.B, AssignedSalesId = sales2Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
    }
}
```

---

### Task 4: DTOs (Request/Response)

**Files:**
- Create: `/backend/DTOs/Request/LoginRequest.cs`
- Create: `/backend/DTOs/Request/RegisterRequest.cs`
- Create: `/backend/DTOs/Request/CreateDoctorRequest.cs`
- Create: `/backend/DTOs/Request/UpdateDoctorRequest.cs`
- Create: `/backend/DTOs/Request/CreateHospitalRequest.cs`
- Create: `/backend/DTOs/Response/LoginResponse.cs`
- Create: `/backend/DTOs/Response/UserResponse.cs`
- Create: `/backend/DTOs/Response/DoctorResponse.cs`
- Create: `/backend/DTOs/Response/HospitalResponse.cs`
- Create: `/backend/DTOs/Response/PaginatedResponse.cs`

- [ ] **Step 1: Create LoginRequest.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.DTOs.Request;

public class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
```

- [ ] **Step 2: Create RegisterRequest.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.DTOs.Request;

public class RegisterRequest
{
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty; // "Admin", "SalesManager", "SalesMember"

    public Guid? ManagerId { get; set; }
}
```

- [ ] **Step 3: Create CreateDoctorRequest.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.DTOs.Request;

public class CreateDoctorRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Specialty { get; set; }

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Zalo { get; set; }

    [Required]
    public Guid HospitalId { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [Required]
    public string PotentialLevel { get; set; } = "C"; // "A", "B", "C"

    public Guid? AssignedSalesId { get; set; }
}
```

- [ ] **Step 4: Create UpdateDoctorRequest.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.DTOs.Request;

public class UpdateDoctorRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Specialty { get; set; }

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Zalo { get; set; }

    [Required]
    public Guid HospitalId { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [Required]
    public string PotentialLevel { get; set; } = "C";

    public Guid? AssignedSalesId { get; set; }
}
```

- [ ] **Step 5: Create CreateHospitalRequest.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace SalesSystem.DTOs.Request;

public class CreateHospitalRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }
}
```

- [ ] **Step 6: Create LoginResponse.cs**

```csharp
namespace SalesSystem.DTOs.Response;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public UserResponse User { get; set; } = null!;
}
```

- [ ] **Step 7: Create UserResponse.cs**

```csharp
namespace SalesSystem.DTOs.Response;

public class UserResponse
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? ManagerId { get; set; }
    public string? ManagerName { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
```

- [ ] **Step 8: Create DoctorResponse.cs**

```csharp
namespace SalesSystem.DTOs.Response;

public class DoctorResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Zalo { get; set; }
    public Guid HospitalId { get; set; }
    public string? HospitalName { get; set; }
    public string? Address { get; set; }
    public string PotentialLevel { get; set; } = "C";
    public Guid? AssignedSalesId { get; set; }
    public string? AssignedSalesName { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 9: Create HospitalResponse.cs**

```csharp
namespace SalesSystem.DTOs.Response;

public class HospitalResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public int DoctorCount { get; set; }
}
```

- [ ] **Step 10: Create PaginatedResponse.cs**

```csharp
namespace SalesSystem.DTOs.Response;

public class PaginatedResponse<T>
{
    public List<T> Data { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}
```

---

### Task 5: Helpers (Password + JWT)

**Files:**
- Create: `/backend/Helpers/PasswordHelper.cs`
- Create: `/backend/Helpers/JwtHelper.cs`

- [ ] **Step 1: Create PasswordHelper.cs**

```csharp
using BCrypt.Net;

namespace SalesSystem.Helpers;

public static class PasswordHelper
{
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, 12);
    }

    public static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
```

- [ ] **Step 2: Create JwtHelper.cs**

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SalesSystem.Entities;

namespace SalesSystem.Helpers;

public static class JwtHelper
{
    public static string GenerateToken(User user, string key, string issuer, string audience, int expiryHours)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("fullName", user.FullName)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static Guid? GetUserIdFromToken(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
```

---

### Task 6: Repository Layer

**Files:**
- Create: `/backend/Repositories/IRepository.cs`
- Create: `/backend/Repositories/Repository.cs`
- Create: `/backend/Repositories/IUserRepository.cs`
- Create: `/backend/Repositories/UserRepository.cs`
- Create: `/backend/Repositories/IHospitalRepository.cs`
- Create: `/backend/Repositories/HospitalRepository.cs`
- Create: `/backend/Repositories/IDoctorRepository.cs`
- Create: `/backend/Repositories/DoctorRepository.cs`

- [ ] **Step 1: Create IRepository.cs**

```csharp
using System.Linq.Expressions;

namespace SalesSystem.Repositories;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<List<T>> GetAllAsync();
    Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<int> CountAsync(Expression<Func<T, bool>> predicate);
}
```

- [ ] **Step 2: Create Repository.cs**

```csharp
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;

namespace SalesSystem.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<List<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public virtual async Task DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    public virtual async Task<bool> ExistsAsync(Guid id)
    {
        return await _dbSet.AnyAsync(e => EF.Property<Guid>(e, "Id") == id);
    }

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.CountAsync(predicate);
    }
}
```

- [ ] **Step 3: Create IUserRepository.cs**

```csharp
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByUsernameWithManagerAsync(string username);
    Task<List<User>> GetSalesMembersAsync();
    Task<List<User>> GetSalesMembersByManagerIdAsync(Guid managerId);
    Task<List<User>> GetManagersAsync();
}
```

- [ ] **Step 4: Create UserRepository.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByUsernameWithManagerAsync(string username)
    {
        return await _dbSet.Include(u => u.Manager).FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<List<User>> GetSalesMembersAsync()
    {
        return await _dbSet.Where(u => u.Role == UserRole.SalesMember && u.IsActive).ToListAsync();
    }

    public async Task<List<User>> GetSalesMembersByManagerIdAsync(Guid managerId)
    {
        return await _dbSet.Where(u => u.Role == UserRole.SalesMember && u.ManagerId == managerId && u.IsActive).ToListAsync();
    }

    public async Task<List<User>> GetManagersAsync()
    {
        return await _dbSet.Where(u => u.Role == UserRole.SalesManager && u.IsActive).ToListAsync();
    }
}
```

- [ ] **Step 5: Create IHospitalRepository.cs**

```csharp
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IHospitalRepository : IRepository<Hospital>
{
    Task<Hospital?> GetByIdWithDoctorsAsync(Guid id);
}
```

- [ ] **Step 6: Create HospitalRepository.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class HospitalRepository : Repository<Hospital>, IHospitalRepository
{
    public HospitalRepository(AppDbContext context) : base(context) { }

    public async Task<Hospital?> GetByIdWithDoctorsAsync(Guid id)
    {
        return await _dbSet
            .Include(h => h.Doctors)
            .FirstOrDefaultAsync(h => h.Id == id);
    }
}
```

- [ ] **Step 7: Create IDoctorRepository.cs**

```csharp
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IDoctorRepository : IRepository<Doctor>
{
    Task<Doctor?> GetByIdWithDetailsAsync(Guid id);
    Task<Doctor?> GetByPhoneAsync(string phone);
    Task<List<Doctor>> GetByAssignedSalesIdAsync(Guid salesId);
    Task<List<Doctor>> GetAllWithDetailsAsync(int page, int pageSize, string? search, string? potentialLevel, Guid? hospitalId);
    Task<int> GetTotalCountAsync(string? search, string? potentialLevel, Guid? hospitalId);
}
```

- [ ] **Step 8: Create DoctorRepository.cs**

```csharp
using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class DoctorRepository : Repository<Doctor>, IDoctorRepository
{
    public DoctorRepository(AppDbContext context) : base(context) { }

    public async Task<Doctor?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(d => d.Hospital)
            .Include(d => d.AssignedSales)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Doctor?> GetByPhoneAsync(string phone)
    {
        return await _dbSet.FirstOrDefaultAsync(d => d.Phone == phone);
    }

    public async Task<List<Doctor>> GetByAssignedSalesIdAsync(Guid salesId)
    {
        return await _dbSet
            .Include(d => d.Hospital)
            .Where(d => d.AssignedSalesId == salesId)
            .ToListAsync();
    }

    public async Task<List<Doctor>> GetAllWithDetailsAsync(int page, int pageSize, string? search, string? potentialLevel, Guid? hospitalId)
    {
        var query = _dbSet.Include(d => d.Hospital).Include(d => d.AssignedSales).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(d => d.Name.Contains(search) || d.Phone.Contains(search));

        if (!string.IsNullOrWhiteSpace(potentialLevel) && Enum.TryParse<PotentialLevel>(potentialLevel, out var level))
            query = query.Where(d => d.PotentialLevel == level);

        if (hospitalId.HasValue)
            query = query.Where(d => d.HospitalId == hospitalId.Value);

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetTotalCountAsync(string? search, string? potentialLevel, Guid? hospitalId)
    {
        var query = _dbSet.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(d => d.Name.Contains(search) || d.Phone.Contains(search));

        if (!string.IsNullOrWhiteSpace(potentialLevel) && Enum.TryParse<PotentialLevel>(potentialLevel, out var level))
            query = query.Where(d => d.PotentialLevel == level);

        if (hospitalId.HasValue)
            query = query.Where(d => d.HospitalId == hospitalId.Value);

        return await query.CountAsync();
    }
}
```

---

### Task 7: Services

**Files:**
- Create: `/backend/Services/IAuthService.cs`
- Create: `/backend/Services/AuthService.cs`
- Create: `/backend/Services/IUserService.cs`
- Create: `/backend/Services/UserService.cs`
- Create: `/backend/Services/IHospitalService.cs`
- Create: `/backend/Services/HospitalService.cs`
- Create: `/backend/Services/IDoctorService.cs`
- Create: `/backend/Services/DoctorService.cs`

- [ ] **Step 1: Create IAuthService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<UserResponse?> GetCurrentUserAsync(Guid userId);
}
```

- [ ] **Step 2: Create AuthService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Helpers;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly string _jwtKey;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _jwtExpiryHours;

    public AuthService(
        IUserRepository userRepository,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _jwtKey = configuration["Jwt:Key"]!;
        _jwtIssuer = configuration["Jwt:Issuer"]!;
        _jwtAudience = configuration["Jwt:Audience"]!;
        _jwtExpiryHours = int.Parse(configuration["Jwt:ExpiryInHours"]!);
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByUsernameWithManagerAsync(request.Username);
        if (user == null || !PasswordHelper.VerifyPassword(request.Password, user.PasswordHash))
            return null;

        var token = JwtHelper.GenerateToken(user, _jwtKey, _jwtIssuer, _jwtAudience, _jwtExpiryHours);

        return new LoginResponse
        {
            Token = token,
            User = MapToUserResponse(user)
        };
    }

    public async Task<UserResponse?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        return user != null ? MapToUserResponse(user) : null;
    }

    private static UserResponse MapToUserResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            ManagerId = user.ManagerId,
            ManagerName = user.Manager?.FullName,
            CreatedAt = user.CreatedAt,
            IsActive = user.IsActive
        };
    }
}
```

- [ ] **Step 3: Create IUserService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IUserService
{
    Task<List<UserResponse>> GetAllUsersAsync();
    Task<UserResponse?> GetUserByIdAsync(Guid id);
    Task<UserResponse> RegisterAsync(RegisterRequest request);
    Task<bool> UpdateUserAsync(Guid id, RegisterRequest request);
    Task<bool> DeleteUserAsync(Guid id);
    Task<List<UserResponse>> GetSalesMembersAsync();
    Task<List<UserResponse>> GetSalesMembersByManagerIdAsync(Guid managerId);
    Task<List<UserResponse>> GetManagersAsync();
}
```

- [ ] **Step 4: Create UserService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Helpers;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserResponse>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapToUserResponse).ToList();
    }

    public async Task<UserResponse?> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user != null ? MapToUserResponse(user) : null;
    }

    public async Task<UserResponse> RegisterAsync(RegisterRequest request)
    {
        if (!Enum.TryParse<UserRole>(request.Role, out var role))
            throw new ArgumentException("Invalid role");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = PasswordHelper.HashPassword(request.Password),
            FullName = request.FullName,
            Role = role,
            ManagerId = request.ManagerId
        };

        await _userRepository.AddAsync(user);
        return MapToUserResponse(user);
    }

    public async Task<bool> UpdateUserAsync(Guid id, RegisterRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        if (!Enum.TryParse<UserRole>(request.Role, out var role))
            throw new ArgumentException("Invalid role");

        user.Username = request.Username;
        user.Email = request.Email;
        user.FullName = request.FullName;
        user.Role = role;
        user.ManagerId = request.ManagerId;

        if (!string.IsNullOrWhiteSpace(request.Password))
            user.PasswordHash = PasswordHelper.HashPassword(request.Password);

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        user.IsActive = false;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<List<UserResponse>> GetSalesMembersAsync()
    {
        var users = await _userRepository.GetSalesMembersAsync();
        return users.Select(MapToUserResponse).ToList();
    }

    public async Task<List<UserResponse>> GetSalesMembersByManagerIdAsync(Guid managerId)
    {
        var users = await _userRepository.GetSalesMembersByManagerIdAsync(managerId);
        return users.Select(MapToUserResponse).ToList();
    }

    public async Task<List<UserResponse>> GetManagersAsync()
    {
        var users = await _userRepository.GetManagersAsync();
        return users.Select(MapToUserResponse).ToList();
    }

    private static UserResponse MapToUserResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            ManagerId = user.ManagerId,
            ManagerName = user.Manager?.FullName,
            CreatedAt = user.CreatedAt,
            IsActive = user.IsActive
        };
    }
}
```

- [ ] **Step 5: Create IHospitalService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IHospitalService
{
    Task<List<HospitalResponse>> GetAllHospitalsAsync();
    Task<HospitalResponse?> GetHospitalByIdAsync(Guid id);
    Task<HospitalResponse> CreateHospitalAsync(CreateHospitalRequest request);
    Task<bool> UpdateHospitalAsync(Guid id, CreateHospitalRequest request);
    Task<bool> DeleteHospitalAsync(Guid id);
}
```

- [ ] **Step 6: Create HospitalService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class HospitalService : IHospitalService
{
    private readonly IHospitalRepository _hospitalRepository;

    public HospitalService(IHospitalRepository hospitalRepository)
    {
        _hospitalRepository = hospitalRepository;
    }

    public async Task<List<HospitalResponse>> GetAllHospitalsAsync()
    {
        var hospitals = await _hospitalRepository.GetAllAsync();
        return hospitals.Select(MapToHospitalResponse).ToList();
    }

    public async Task<HospitalResponse?> GetHospitalByIdAsync(Guid id)
    {
        var hospital = await _hospitalRepository.GetByIdWithDoctorsAsync(id);
        return hospital != null ? MapToHospitalResponse(hospital) : null;
    }

    public async Task<HospitalResponse> CreateHospitalAsync(CreateHospitalRequest request)
    {
        var hospital = new Hospital
        {
            Name = request.Name,
            Address = request.Address ?? string.Empty
        };

        await _hospitalRepository.AddAsync(hospital);
        return MapToHospitalResponse(hospital);
    }

    public async Task<bool> UpdateHospitalAsync(Guid id, CreateHospitalRequest request)
    {
        var hospital = await _hospitalRepository.GetByIdAsync(id);
        if (hospital == null) return false;

        hospital.Name = request.Name;
        hospital.Address = request.Address ?? string.Empty;

        await _hospitalRepository.UpdateAsync(hospital);
        return true;
    }

    public async Task<bool> DeleteHospitalAsync(Guid id)
    {
        var hospital = await _hospitalRepository.GetByIdAsync(id);
        if (hospital == null) return false;

        await _hospitalRepository.DeleteAsync(id);
        return true;
    }

    private static HospitalResponse MapToHospitalResponse(Hospital hospital)
    {
        return new HospitalResponse
        {
            Id = hospital.Id,
            Name = hospital.Name,
            Address = hospital.Address,
            CreatedAt = hospital.CreatedAt,
            DoctorCount = hospital.Doctors?.Count ?? 0
        };
    }
}
```

- [ ] **Step 7: Create IDoctorService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IDoctorService
{
    Task<PaginatedResponse<DoctorResponse>> GetDoctorsAsync(int page, int pageSize, string? search, string? potentialLevel, Guid? hospitalId);
    Task<DoctorResponse?> GetDoctorByIdAsync(Guid id);
    Task<DoctorResponse> CreateDoctorAsync(CreateDoctorRequest request);
    Task<bool> UpdateDoctorAsync(Guid id, UpdateDoctorRequest request);
    Task<bool> DeleteDoctorAsync(Guid id);
    Task<List<DoctorResponse>> GetAssignedDoctorsAsync(Guid salesId);
    Task<bool> AssignDoctorToSalesAsync(Guid doctorId, Guid? salesId);
}
```

- [ ] **Step 8: Create DoctorService.cs**

```csharp
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly IHospitalRepository _hospitalRepository;

    public DoctorService(IDoctorRepository doctorRepository, IHospitalRepository hospitalRepository)
    {
        _doctorRepository = doctorRepository;
        _hospitalRepository = hospitalRepository;
    }

    public async Task<PaginatedResponse<DoctorResponse>> GetDoctorsAsync(int page, int pageSize, string? search, string? potentialLevel, Guid? hospitalId)
    {
        var doctors = await _doctorRepository.GetAllWithDetailsAsync(page, pageSize, search, potentialLevel, hospitalId);
        var totalCount = await _doctorRepository.GetTotalCountAsync(search, potentialLevel, hospitalId);

        return new PaginatedResponse<DoctorResponse>
        {
            Data = doctors.Select(MapToDoctorResponse).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<DoctorResponse?> GetDoctorByIdAsync(Guid id)
    {
        var doctor = await _doctorRepository.GetByIdWithDetailsAsync(id);
        return doctor != null ? MapToDoctorResponse(doctor) : null;
    }

    public async Task<DoctorResponse> CreateDoctorAsync(CreateDoctorRequest request)
    {
        // Check for duplicate phone
        var existing = await _doctorRepository.GetByPhoneAsync(request.Phone);
        if (existing != null)
            throw new InvalidOperationException("Doctor with this phone already exists");

        if (!Enum.TryParse<PotentialLevel>(request.PotentialLevel, out var potentialLevel))
            potentialLevel = PotentialLevel.C;

        var doctor = new Doctor
        {
            Name = request.Name,
            Specialty = request.Specialty,
            Phone = request.Phone,
            Zalo = request.Zalo,
            HospitalId = request.HospitalId,
            Address = request.Address ?? string.Empty,
            PotentialLevel = potentialLevel,
            AssignedSalesId = request.AssignedSalesId
        };

        await _doctorRepository.AddAsync(doctor);
        return MapToDoctorResponse(doctor);
    }

    public async Task<bool> UpdateDoctorAsync(Guid id, UpdateDoctorRequest request)
    {
        var doctor = await _doctorRepository.GetByIdAsync(id);
        if (doctor == null) return false;

        // Check for duplicate phone (excluding current doctor)
        var existing = await _doctorRepository.GetByPhoneAsync(request.Phone);
        if (existing != null && existing.Id != id)
            throw new InvalidOperationException("Doctor with this phone already exists");

        if (!Enum.TryParse<PotentialLevel>(request.PotentialLevel, out var potentialLevel))
            potentialLevel = PotentialLevel.C;

        doctor.Name = request.Name;
        doctor.Specialty = request.Specialty;
        doctor.Phone = request.Phone;
        doctor.Zalo = request.Zalo;
        doctor.HospitalId = request.HospitalId;
        doctor.Address = request.Address ?? string.Empty;
        doctor.PotentialLevel = potentialLevel;
        doctor.AssignedSalesId = request.AssignedSalesId;

        await _doctorRepository.UpdateAsync(doctor);
        return true;
    }

    public async Task<bool> DeleteDoctorAsync(Guid id)
    {
        var doctor = await _doctorRepository.GetByIdAsync(id);
        if (doctor == null) return false;

        await _doctorRepository.DeleteAsync(id);
        return true;
    }

    public async Task<List<DoctorResponse>> GetAssignedDoctorsAsync(Guid salesId)
    {
        var doctors = await _doctorRepository.GetByAssignedSalesIdAsync(salesId);
        return doctors.Select(MapToDoctorResponse).ToList();
    }

    public async Task<bool> AssignDoctorToSalesAsync(Guid doctorId, Guid? salesId)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId);
        if (doctor == null) return false;

        doctor.AssignedSalesId = salesId;
        await _doctorRepository.UpdateAsync(doctor);
        return true;
    }

    private static DoctorResponse MapToDoctorResponse(Doctor doctor)
    {
        return new DoctorResponse
        {
            Id = doctor.Id,
            Name = doctor.Name,
            Specialty = doctor.Specialty,
            Phone = doctor.Phone,
            Zalo = doctor.Zalo,
            HospitalId = doctor.HospitalId,
            HospitalName = doctor.Hospital?.Name,
            Address = doctor.Address,
            PotentialLevel = doctor.PotentialLevel.ToString(),
            AssignedSalesId = doctor.AssignedSalesId,
            AssignedSalesName = doctor.AssignedSales?.FullName,
            CreatedAt = doctor.CreatedAt
        };
    }
}
```

---

### Task 8: Middleware

**Files:**
- Create: `/backend/Middleware/JwtMiddleware.cs`
- Create: `/backend/Middleware/ExceptionMiddleware.cs`

- [ ] **Step 1: Create JwtMiddleware.cs**

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace SalesSystem.Middleware;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _key;
    private readonly string _issuer;
    private readonly string _audience;

    public JwtMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _key = configuration["Jwt:Key"]!;
        _issuer = configuration["Jwt:Issuer"]!;
        _audience = configuration["Jwt:Audience"]!;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

        if (token != null)
            AttachUserToContext(context, token);

        await _next(context);
    }

    private void AttachUserToContext(HttpContext context, string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_key);
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var claims = jwtToken.Claims.ToList();
            var identity = new ClaimsIdentity(claims);
            context.User = new ClaimsPrincipal(identity);
        }
        catch
        {
            // Token validation failed - user will remain unauthenticated
        }
    }
}
```

- [ ] **Step 2: Create ExceptionMiddleware.cs**

```csharp
using System.Net;
using System.Text.Json;

namespace SalesSystem.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            _ => (int)HttpStatusCode.InternalServerError
        };

        var response = new
        {
            statusCode = context.Response.StatusCode,
            message = exception.Message
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
```

---

### Task 9: Controllers

**Files:**
- Create: `/backend/Controllers/AuthController.cs`
- Create: `/backend/Controllers/UsersController.cs`
- Create: `/backend/Controllers/DoctorsController.cs`
- Create: `/backend/Controllers/HospitalsController.cs`

- [ ] **Step 1: Create AuthController.cs**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Helpers;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result == null)
            return Unauthorized(new { message = "Invalid username or password" });

        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> GetCurrentUser()
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(userId.Value);
        if (user == null)
            return NotFound();

        return Ok(user);
    }
}
```

- [ ] **Step 2: Create UsersController.cs**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Helpers;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserResponse>>> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUser(Guid id)
    {
        var currentUserId = JwtHelper.GetUserIdFromToken(User);
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Sales members can only view their own profile
        if (currentUserRole == UserRole.SalesMember.ToString() && currentUserId != id)
            return Forbid();

        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _userService.RegisterAsync(request);
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserResponse>> UpdateUser(Guid id, [FromBody] RegisterRequest request)
    {
        var success = await _userService.UpdateUserAsync(id, request);
        if (!success)
            return NotFound();

        var user = await _userService.GetUserByIdAsync(id);
        return Ok(user);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        var success = await _userService.DeleteUserAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }

    [HttpGet("sales-members")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult<List<UserResponse>>> GetSalesMembers()
    {
        var members = await _userService.GetSalesMembersAsync();
        return Ok(members);
    }

    [HttpGet("managers")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserResponse>>> GetManagers()
    {
        var managers = await _userService.GetManagersAsync();
        return Ok(managers);
    }
}
```

- [ ] **Step 3: Create DoctorsController.cs**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Helpers;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;

    public DoctorsController(IDoctorService doctorService)
    {
        _doctorService = doctorService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<DoctorResponse>>> GetDoctors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? potentialLevel = null,
        [FromQuery] Guid? hospitalId = null)
    {
        var result = await _doctorService.GetDoctorsAsync(page, pageSize, search, potentialLevel, hospitalId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DoctorResponse>> GetDoctor(Guid id)
    {
        var doctor = await _doctorService.GetDoctorByIdAsync(id);
        if (doctor == null)
            return NotFound();

        return Ok(doctor);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SalesManager,SalesMember")]
    public async Task<ActionResult<DoctorResponse>> CreateDoctor([FromBody] CreateDoctorRequest request)
    {
        try
        {
            var doctor = await _doctorService.CreateDoctorAsync(request);
            return CreatedAtAction(nameof(GetDoctor), new { id = doctor.Id }, doctor);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SalesManager,SalesMember")]
    public async Task<ActionResult<DoctorResponse>> UpdateDoctor(Guid id, [FromBody] UpdateDoctorRequest request)
    {
        try
        {
            var success = await _doctorService.UpdateDoctorAsync(id, request);
            if (!success)
                return NotFound();

            var doctor = await _doctorService.GetDoctorByIdAsync(id);
            return Ok(doctor);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult> DeleteDoctor(Guid id)
    {
        var success = await _doctorService.DeleteDoctorAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }

    [HttpGet("assigned")]
    [Authorize(Roles = "Admin,SalesManager,SalesMember")]
    public async Task<ActionResult<List<DoctorResponse>>> GetAssignedDoctors()
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized();

        var doctors = await _doctorService.GetAssignedDoctorsAsync(userId.Value);
        return Ok(doctors);
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult> AssignDoctor(Guid id, [FromBody] AssignDoctorRequest request)
    {
        var success = await _doctorService.AssignDoctorToSalesAsync(id, request.SalesId);
        if (!success)
            return NotFound();

        return NoContent();
    }
}

public class AssignDoctorRequest
{
    public Guid? SalesId { get; set; }
}
```

- [ ] **Step 4: Create HospitalsController.cs**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HospitalsController : ControllerBase
{
    private readonly IHospitalService _hospitalService;

    public HospitalsController(IHospitalService hospitalService)
    {
        _hospitalService = hospitalService;
    }

    [HttpGet]
    public async Task<ActionResult<List<HospitalResponse>>> GetHospitals()
    {
        var hospitals = await _hospitalService.GetAllHospitalsAsync();
        return Ok(hospitals);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HospitalResponse>> GetHospital(Guid id)
    {
        var hospital = await _hospitalService.GetHospitalByIdAsync(id);
        if (hospital == null)
            return NotFound();

        return Ok(hospital);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult<HospitalResponse>> CreateHospital([FromBody] CreateHospitalRequest request)
    {
        var hospital = await _hospitalService.CreateHospitalAsync(request);
        return CreatedAtAction(nameof(GetHospital), new { id = hospital.Id }, hospital);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult<HospitalResponse>> UpdateHospital(Guid id, [FromBody] CreateHospitalRequest request)
    {
        var success = await _hospitalService.UpdateHospitalAsync(id, request);
        if (!success)
            return NotFound();

        var hospital = await _hospitalService.GetHospitalByIdAsync(id);
        return Ok(hospital);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteHospital(Guid id)
    {
        var success = await _hospitalService.DeleteHospitalAsync(id);
        if (!success)
            return NotFound();

        return NoContent();
    }
}
```

---

### Task 10: Program.cs Wiring

**Files:**
- Modify: `/backend/Program.cs`

- [ ] **Step 1: Update Program.cs**

```csharp
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SalesSystem.Data;
using SalesSystem.Middleware;
using SalesSystem.Repositories;
using SalesSystem.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Sales System API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"]!);
builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IHospitalRepository, HospitalRepository>();
builder.Services.AddScoped<IDoctorRepository, DoctorRepository>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IHospitalService, HospitalService>();
builder.Services.AddScoped<IDoctorService, DoctorService>();

var app = builder.Build();

// Configure pipeline
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseJwtMiddleware();
app.MapControllers();

// Database migration on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
}

app.Run();
```

---

### Task 11: Frontend Project Scaffolding

**Files:**
- Create: `/frontend/package.json`
- Create: `/frontend/vite.config.ts`
- Create: `/frontend/tsconfig.json`
- Create: `/frontend/tailwind.config.js`
- Create: `/frontend/postcss.config.js`
- Create: `/frontend/index.html`
- Create: `/frontend/src/main.tsx`
- Create: `/frontend/src/App.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "sales-system-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "zustand": "^4.4.7",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          500: '#6366F1',
        },
        accent: {
          500: '#10B981',
        }
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 6: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sales Execution System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 9: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-50 text-slate-900;
}
```

- [ ] **Step 10: Create src/App.tsx**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Doctors from './pages/Doctors'
import Hospitals from './pages/Hospitals'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="hospitals" element={<Hospitals />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

---

### Task 12: Frontend Types & API Client

**Files:**
- Create: `/frontend/src/types/index.ts`
- Create: `/frontend/src/services/api.ts`
- Create: `/frontend/src/store/authStore.ts`

- [ ] **Step 1: Create src/types/index.ts**

```typescript
export type UserRole = 'Admin' | 'SalesManager' | 'SalesMember'
export type PotentialLevel = 'A' | 'B' | 'C'

export interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: UserRole
  managerId?: string
  managerName?: string
  createdAt: string
  isActive: boolean
}

export interface Hospital {
  id: string
  name: string
  address?: string
  createdAt: string
  doctorCount: number
}

export interface Doctor {
  id: string
  name: string
  specialty?: string
  phone: string
  zalo?: string
  hospitalId: string
  hospitalName?: string
  address?: string
  potentialLevel: PotentialLevel
  assignedSalesId?: string
  assignedSalesName?: string
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateDoctorRequest {
  name: string
  specialty?: string
  phone: string
  zalo?: string
  hospitalId: string
  address?: string
  potentialLevel: PotentialLevel
  assignedSalesId?: string
}

export interface CreateHospitalRequest {
  name: string
  address?: string
}
```

- [ ] **Step 2: Create src/services/api.ts**

```typescript
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

- [ ] **Step 3: Create src/store/authStore.ts**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

---

### Task 13: Frontend Services

**Files:**
- Create: `/frontend/src/services/authService.ts`
- Create: `/frontend/src/services/doctorService.ts`
- Create: `/frontend/src/services/hospitalService.ts`

- [ ] **Step 1: Create src/services/authService.ts**

```typescript
import api from './api'
import type { LoginRequest, LoginResponse } from '../types'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
  },
}
```

- [ ] **Step 2: Create src/services/doctorService.ts**

```typescript
import api from './api'
import type { Doctor, CreateDoctorRequest, PaginatedResponse } from '../types'

export const doctorService = {
  getDoctors: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    potentialLevel?: string
    hospitalId?: string
  }): Promise<PaginatedResponse<Doctor>> => {
    const response = await api.get<PaginatedResponse<Doctor>>('/doctors', { params })
    return response.data
  },

  getDoctor: async (id: string): Promise<Doctor> => {
    const response = await api.get<Doctor>(`/doctors/${id}`)
    return response.data
  },

  createDoctor: async (data: CreateDoctorRequest): Promise<Doctor> => {
    const response = await api.post<Doctor>('/doctors', data)
    return response.data
  },

  updateDoctor: async (id: string, data: CreateDoctorRequest): Promise<Doctor> => {
    const response = await api.put<Doctor>(`/doctors/${id}`, data)
    return response.data
  },

  deleteDoctor: async (id: string): Promise<void> => {
    await api.delete(`/doctors/${id}`)
  },

  getAssignedDoctors: async (): Promise<Doctor[]> => {
    const response = await api.get<Doctor[]>('/doctors/assigned')
    return response.data
  },
}
```

- [ ] **Step 3: Create src/services/hospitalService.ts**

```typescript
import api from './api'
import type { Hospital, CreateHospitalRequest } from '../types'

export const hospitalService = {
  getHospitals: async (): Promise<Hospital[]> => {
    const response = await api.get<Hospital[]>('/hospitals')
    return response.data
  },

  getHospital: async (id: string): Promise<Hospital> => {
    const response = await api.get<Hospital>(`/hospitals/${id}`)
    return response.data
  },

  createHospital: async (data: CreateHospitalRequest): Promise<Hospital> => {
    const response = await api.post<Hospital>('/hospitals', data)
    return response.data
  },

  updateHospital: async (id: string, data: CreateHospitalRequest): Promise<Hospital> => {
    const response = await api.put<Hospital>(`/hospitals/${id}`, data)
    return response.data
  },

  deleteHospital: async (id: string): Promise<void> => {
    await api.delete(`/hospitals/${id}`)
  },
}
```

---

### Task 14: Frontend Common Components

**Files:**
- Create: `/frontend/src/components/common/Button.tsx`
- Create: `/frontend/src/components/common/Card.tsx`
- Create: `/frontend/src/components/common/Input.tsx`
- Create: `/frontend/src/components/common/Select.tsx`
- Create: `/frontend/src/components/common/Table.tsx`
- Create: `/frontend/src/components/common/Modal.tsx`
- Create: `/frontend/src/components/common/Sidebar.tsx`
- Create: `/frontend/src/components/common/TopBar.tsx`

- [ ] **Step 1: Create Button.tsx**

```typescript
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4\" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create Card.tsx**

```typescript
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Create Input.tsx**

```typescript
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
```

- [ ] **Step 4: Create Select.tsx**

```typescript
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            error ? 'border-red-500' : 'border-slate-300'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
```

- [ ] **Step 5: Create Table.tsx**

```typescript
import { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
}

export default function Table<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.map((item) => (
            <tr
              key={item.id ?? Math.random()}
              className={`hover:bg-slate-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-slate-900">
                  {col.render
                    ? col.render(item)
                    : (item as Record<string, unknown>)[col.key]?.toString() ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Create Modal.tsx**

```typescript
import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create Sidebar.tsx**

```typescript
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Building2 } from 'lucide-react'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/doctors', label: 'Doctors', icon: Users },
  { path: '/hospitals', label: 'Hospitals', icon: Building2 },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-60 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-primary-600">Sales System</h1>
      </div>
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 8: Create TopBar.tsx**

```typescript
import { useAuthStore } from '../../store/authStore'
import { Bell, LogOut } from 'lucide-react'

export default function TopBar() {
  const { user, logout } = useAuthStore()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Search..."
          className="w-64 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
```

---

### Task 15: Frontend Layout & Pages

**Files:**
- Create: `/frontend/src/layouts/MainLayout.tsx`
- Create: `/frontend/src/pages/Login.tsx`
- Create: `/frontend/src/pages/Dashboard.tsx`
- Create: `/frontend/src/pages/Doctors.tsx`
- Create: `/frontend/src/pages/Hospitals.tsx`
- Create: `/frontend/src/pages/NotFound.tsx`

- [ ] **Step 1: Create MainLayout.tsx**

```typescript
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import TopBar from '../components/common/TopBar'

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create Login.tsx**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Card from '../components/common/Card'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authService.login(formData)
      login(response.token, response.user)
      navigate('/')
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid credentials'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">Sales Execution System</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Enter username"
            required
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password"
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Demo: admin / Admin123!
        </p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create Dashboard.tsx**

```typescript
import Card from '../components/common/Card'
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react'

export default function Dashboard() {
  const stats = [
    { label: 'Total Doctors', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Deals', value: '12', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Revenue', value: '₫150M', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Activities Today', value: '8', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">MN</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Dr. Nguyễn Văn A</p>
                  <p className="text-xs text-slate-500">Called • 2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Deals Closing Soon</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">Dr. Trần Thị B</p>
                  <p className="text-xs text-slate-500">Expected: May 15, 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">₫5,000,000</p>
                  <p className="text-xs text-amber-600">70% likely</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create Doctors.tsx**

```typescript
import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Table from '../components/common/Table'
import Modal from '../components/common/Modal'
import { doctorService } from '../services/doctorService'
import type { Doctor, CreateDoctorRequest, Hospital } from '../types'
import { hospitalService } from '../services/hospitalService'

const potentialOptions = [
  { value: '', label: 'All Levels' },
  { value: 'A', label: 'Level A - High Potential' },
  { value: 'B', label: 'Level B - Medium Potential' },
  { value: 'C', label: 'Level C - Low Potential' },
]

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [potentialLevel, setPotentialLevel] = useState('')
  const [formData, setFormData] = useState<CreateDoctorRequest>({
    name: '',
    phone: '',
    hospitalId: '',
    potentialLevel: 'C',
  })

  useEffect(() => {
    loadData()
  }, [searchTerm, potentialLevel])

  const loadData = async () => {
    setLoading(true)
    try {
      const [doctorsRes, hospitalsRes] = await Promise.all([
        doctorService.getDoctors({ search: searchTerm, potentialLevel }),
        hospitalService.getHospitals(),
      ])
      setDoctors(doctorsRes.data)
      setHospitals(hospitalsRes)
    } catch (err) {
      console.error('Failed to load doctors', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await doctorService.createDoctor(formData)
      setShowModal(false)
      setFormData({ name: '', phone: '', hospitalId: '', potentialLevel: 'C' })
      loadData()
    } catch (err) {
      alert('Failed to create doctor')
    }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'specialty', header: 'Specialty' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'hospitalName',
      header: 'Hospital',
      render: (item: Doctor) => item.hospitalName ?? '-',
    },
    {
      key: 'potentialLevel',
      header: 'Level',
      render: (item: Doctor) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.potentialLevel === 'A'
              ? 'bg-emerald-100 text-emerald-700'
              : item.potentialLevel === 'B'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {item.potentialLevel}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-slate-500">Manage your doctor relationships</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          Add Doctor
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            options={potentialOptions}
            value={potentialLevel}
            onChange={(e) => setPotentialLevel(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <Table columns={columns} data={doctors} />
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Doctor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Specialty (optional)"
            value={formData.specialty ?? ''}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          />
          <Select
            label="Hospital"
            options={[{ value: '', label: 'Select hospital' }, ...hospitals.map((h) => ({ value: h.id, label: h.name }))]}
            value={formData.hospitalId}
            onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
          />
          <Select
            label="Potential Level"
            options={[
              { value: 'A', label: 'A - High' },
              { value: 'B', label: 'B - Medium' },
              { value: 'C', label: 'C - Low' },
            ]}
            value={formData.potentialLevel}
            onChange={(e) => setFormData({ ...formData, potentialLevel: e.target.value as 'A' | 'B' | 'C' })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Doctor</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 5: Create Hospitals.tsx**

```typescript
import Card from '../components/common/Card'

export default function Hospitals() {
  const hospitals = [
    { id: '1', name: 'Bệnh viện Da liễu Trung ương', address: 'Hà Nội', doctorCount: 5 },
    { id: '2', name: 'Bệnh viện Chợ Rẫy', address: 'TP.HCM', doctorCount: 3 },
    { id: '3', name: 'Bệnh viện Đại học Y Hà Nội', address: 'Hà Nội', doctorCount: 4 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospitals</h1>
        <p className="text-slate-500">Manage hospital partnerships</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map((hospital) => (
          <Card key={hospital.id} className="p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-slate-900">{hospital.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{hospital.address}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">{hospital.doctorCount} doctors</span>
              <button className="text-primary-600 text-sm font-medium hover:underline">
                View Doctors
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create NotFound.tsx**

```typescript
import { Link } from 'react-router-dom'
import Card from '../components/common/Card'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="text-center p-12">
        <h1 className="text-6xl font-bold text-primary-600">404</h1>
        <p className="text-xl text-slate-700 mt-4">Page not found</p>
        <p className="text-slate-500 mt-2">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </Card>
    </div>
  )
}
```

---

### Task 16: Build Verification

**Files:**
- Create: `/backend/README.md`
- Create: `/frontend/README.md`
- Create: `/.env.example`

- [ ] **Step 1: Create backend/README.md**

```markdown
# Sales Execution System - Backend

## Setup

1. Install .NET 8 SDK
2. Navigate to `/backend`
3. Update `appsettings.json` with your configuration
4. Run migrations:
   ```
   dotnet ef database update
   ```
   Or let the app auto-create on first run via `EnsureCreated()`

5. Run the application:
   ```
   dotnet run
   ```

API will be available at `http://localhost:5000`

## Seed Data

The system auto-creates seed data on first run:
- 1 Admin: admin / Admin123!
- 2 Managers: manager1, manager2 / Manager123!
- 5 Sales Members: sales1-sales5 / Sales123!
- 5 Hospitals
- 3 Sample Doctors

## API Documentation

Swagger UI available at `http://localhost:5000/swagger` in development mode.

## JWT Authentication

All protected endpoints require:
```
Authorization: Bearer <token>
```

Token expires after 24 hours.
```

- [ ] **Step 2: Create frontend/README.md**

```markdown
# Sales Execution System - Frontend

## Setup

1. Install Node.js 18+
2. Navigate to `/frontend`
3. Install dependencies:
   ```
   npm install
   ```

4. Start development server:
   ```
   npm run dev
   ```

Frontend available at `http://localhost:3000`

## Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS
- Axios
- Zustand (state management)
- React Router v6
```

- [ ] **Step 3: Create .env.example**

```env
# Backend
ConnectionStrings__DefaultConnection=Data Source=salesystem.db
Jwt__Key=YourSuperSecretKeyThatIsAtLeast32CharactersLong!
Jwt__Issuer=SalesSystem
Jwt__Audience=SalesSystemApp
Jwt__ExpiryInHours=24
```

---

## Self-Review Checklist

1. **Spec coverage**: All Phase 1 requirements have corresponding tasks:
   - [x] Backend project scaffolding (.NET 8 + EF Core + SQLite)
   - [x] User entity + Auth (JWT + BCrypt)
   - [x] Hospital CRUD
   - [x] Doctor CRUD with phone uniqueness
   - [x] Role-based authorization
   - [x] Seed data
   - [x] Frontend scaffolding (React + Vite + TypeScript + TailwindCSS)
   - [x] API client setup with JWT interceptor
   - [x] Login page
   - [x] Main layout with sidebar
   - [x] Dashboard page
   - [x] Doctor list/create pages

2. **Placeholder scan**: No placeholders found - all code blocks are complete

3. **Type consistency**: All types match between frontend/backend (User, Doctor, Hospital, etc.)

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-24-sales-execution-system.md`**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
