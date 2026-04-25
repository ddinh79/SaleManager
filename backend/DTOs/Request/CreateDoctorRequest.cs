using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

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
    [RegularExpression(@"^(0[0-9]{9,10})$", ErrorMessage = "Invalid Vietnamese phone number (09x/03x/07x/08x)")]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Zalo { get; set; }

    [Required]
    public Guid HospitalId { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    public string PotentialLevel { get; set; } = "C";

    public Guid? AssignedSalesId { get; set; }
}