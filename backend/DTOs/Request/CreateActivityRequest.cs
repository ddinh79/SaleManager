using System.ComponentModel.DataAnnotations;
using SalesSystem.Entities;

namespace SalesSystem.DTOs.Request;

public class CreateActivityRequest
{
    [Required]
    public Guid DoctorId { get; set; }

    [Required]
    public ActivityType Type { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public string? Result { get; set; }

    public DateTime? NextFollowUpAt { get; set; }

    public decimal? Lat { get; set; }

    public decimal? Lng { get; set; }

    public string? DeviceId { get; set; }
}