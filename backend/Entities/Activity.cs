using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class Activity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SalesId { get; set; }
    public User Sales { get; set; } = null!;

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public ActivityType Type { get; set; }

    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public ActivityResult Result { get; set; }

    public DateTime? NextFollowUpDate { get; set; }

    public GpsStatus GpsStatus { get; set; }
    public int? DistanceMeters { get; set; }
    public string? DeviceId { get; set; }
    public string? GpsResult { get; set; }

    public decimal? CheckinLat { get; set; }
    public decimal? CheckinLng { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
