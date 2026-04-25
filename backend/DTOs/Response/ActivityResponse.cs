namespace SalesSystem.DTOs.Response;

public class ActivityResponse
{
    public Guid Id { get; set; }
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Result { get; set; }
    public DateTime? NextFollowUpAt { get; set; }
    public decimal? CheckinLat { get; set; }
    public decimal? CheckinLng { get; set; }
    public string GpsStatus { get; set; } = string.Empty;
    public int? DistanceMeters { get; set; }
    public DateTime CreatedAt { get; set; }
}