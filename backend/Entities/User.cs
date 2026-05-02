using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class User
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; }

    public Guid? ManagerId { get; set; }

    public User? Manager { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsActive { get; set; } = true;

    public decimal RevenueTarget { get; set; } = 0;
    public int DealsTarget { get; set; } = 0;

    public ICollection<User> TeamMembers { get; set; } = new List<User>();

    public ICollection<Doctor> AssignedDoctors { get; set; } = new List<Doctor>();

    public ICollection<Activity> Activities { get; set; } = new List<Activity>();

    public ICollection<Deal> Deals { get; set; } = new List<Deal>();

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}