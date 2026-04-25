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

        modelBuilder.Entity<Doctor>()
            .HasIndex(d => new { d.HospitalId, d.PotentialLevel });

        modelBuilder.Entity<Doctor>()
            .HasIndex(d => d.AssignedSalesId);

        modelBuilder.Entity<Doctor>()
            .HasIndex(d => d.CreatedAt);

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
        var adminHash = "$2a$12$Xyh.3jZhyvSWHjTTOm6SkuaLEPdaN8/kKxP5kXoFJIM.LmjcNJ2Va";
        var managerHash = "$2a$12$Xt6.HYjZbK7RZuC2C9E0Z.S9UhMZ4g.SM2MHe2gOGAyAhRLK3aXa.";
        var salesHash = "$2a$12$vYGgbWOwgQwmV3IdsazAQe.s1mqNUaa8NR.ZX3pz84IU/JXb3Wzly";

        modelBuilder.Entity<User>().HasData(
            new User { Id = adminId, Username = "admin", Email = "admin@test.com", PasswordHash = adminHash, FullName = "Nguyễn CEO", Role = UserRole.Admin, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = manager1Id, Username = "manager1", Email = "manager1@test.com", PasswordHash = managerHash, FullName = "Trần Manager", Role = UserRole.SalesManager, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = manager2Id, Username = "manager2", Email = "manager2@test.com", PasswordHash = managerHash, FullName = "Lê Manager", Role = UserRole.SalesManager, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales1Id, Username = "sales1", Email = "sales1@test.com", PasswordHash = salesHash, FullName = "Minh Sales", Role = UserRole.SalesMember, ManagerId = manager1Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales2Id, Username = "sales2", Email = "sales2@test.com", PasswordHash = salesHash, FullName = "Hùng Sales", Role = UserRole.SalesMember, ManagerId = manager1Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales3Id, Username = "sales3", Email = "sales3@test.com", PasswordHash = salesHash, FullName = "Lan Sales", Role = UserRole.SalesMember, ManagerId = manager2Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales4Id, Username = "sales4", Email = "sales4@test.com", PasswordHash = salesHash, FullName = "Chi Sales", Role = UserRole.SalesMember, ManagerId = manager2Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new User { Id = sales5Id, Username = "sales5", Email = "sales5@test.com", PasswordHash = salesHash, FullName = "Phong Sales", Role = UserRole.SalesMember, ManagerId = manager2Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
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