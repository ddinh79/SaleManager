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
    public DbSet<UserPlanSettings> UserPlanSettings => Set<UserPlanSettings>();
    public DbSet<UserPlanMetrics> UserPlanMetrics => Set<UserPlanMetrics>();
    public DbSet<DailyPlan> DailyPlans => Set<DailyPlan>();
    public DbSet<DailyPlanTask> DailyPlanTasks => Set<DailyPlanTask>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationDedup> NotificationDedups => Set<NotificationDedup>();
    public DbSet<NotificationSettings> NotificationSettings => Set<NotificationSettings>();
    public DbSet<TranslationKey> TranslationKeys => Set<TranslationKey>();
    public DbSet<Translation> Translations => Set<Translation>();
    public DbSet<I18nVersion> I18nVersions => Set<I18nVersion>();
    public DbSet<TranslationAuditLog> TranslationAuditLogs => Set<TranslationAuditLog>();
    public DbSet<TranslationMissingLog> TranslationMissingLogs => Set<TranslationMissingLog>();

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

        // Notification -> User (many-to-one)
        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Notification indexes for query performance
        modelBuilder.Entity<Notification>()
            .HasIndex(n => n.UserId);

        modelBuilder.Entity<Notification>()
            .HasIndex(n => n.IsRead);

        modelBuilder.Entity<Notification>()
            .HasIndex(n => n.CreatedAt);

        // Composite index for common query: user + unread + date
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

        // NotificationDedup index (non-unique now, for dedup lookups)
        modelBuilder.Entity<NotificationDedup>()
            .HasIndex(d => new { d.UserId, d.Type, d.Date });

        // NotificationSettings -> User (one-to-one)
        modelBuilder.Entity<NotificationSettings>()
            .HasOne(ns => ns.User)
            .WithMany()
            .HasForeignKey(ns => ns.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // DailyPlan -> DailyPlanTask
        modelBuilder.Entity<DailyPlan>()
            .HasMany(p => p.Tasks)
            .WithOne(t => t.DailyPlan)
            .HasForeignKey(t => t.DailyPlanId)
            .OnDelete(DeleteBehavior.Cascade);

        // DailyPlan -> User
        modelBuilder.Entity<DailyPlan>()
            .HasOne(p => p.Sales)
            .WithMany()
            .HasForeignKey(p => p.SalesId)
            .OnDelete(DeleteBehavior.Restrict);

        // UserPlanSettings -> User (one-to-one)
        modelBuilder.Entity<UserPlanSettings>()
            .HasOne(s => s.User)
            .WithOne()
            .HasForeignKey<UserPlanSettings>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // UserPlanMetrics -> User (one-to-one)
        modelBuilder.Entity<UserPlanMetrics>()
            .HasOne(m => m.User)
            .WithOne()
            .HasForeignKey<UserPlanMetrics>(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // TranslationKey configuration
        modelBuilder.Entity<TranslationKey>(entity =>
        {
            entity.HasIndex(e => e.Key).IsUnique();
            entity.HasIndex(e => e.Category);
        });

        // Translation configuration
        modelBuilder.Entity<Translation>(entity =>
        {
            entity.HasIndex(e => new { e.TranslationKeyId, e.Locale }).IsUnique();

            entity.HasOne(t => t.TranslationKey)
                .WithMany(tk => tk.Translations)
                .HasForeignKey(t => t.TranslationKeyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // I18nVersion configuration
        modelBuilder.Entity<I18nVersion>(entity =>
        {
            entity.HasKey(e => e.Locale);
        });

        // TranslationAuditLog configuration
        modelBuilder.Entity<TranslationAuditLog>(entity =>
        {
            entity.HasIndex(e => e.CreatedAt);
        });

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