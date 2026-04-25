using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class Doctor
{
    [Key]
    public Guid Id { get; set; }

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

    public Hospital Hospital { get; set; } = null!;

    [MaxLength(500)]
    public string? Address { get; set; }

    public PotentialLevel PotentialLevel { get; set; } = PotentialLevel.C;

    public Guid? AssignedSalesId { get; set; }

    public User? AssignedSales { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? LastActivityAt { get; set; }
    public DateTime? NextFollowUpAt { get; set; }

    public ICollection<Activity> Activities { get; set; } = new List<Activity>();

    public ICollection<Deal> Deals { get; set; } = new List<Deal>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}