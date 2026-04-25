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