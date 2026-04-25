using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class Hospital
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
}