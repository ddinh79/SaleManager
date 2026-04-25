namespace SalesSystem.DTOs.Response;

public class HospitalResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public int DoctorCount { get; set; }
}