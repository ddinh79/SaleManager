namespace SalesSystem.DTOs.Response;

public class DoctorResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Zalo { get; set; }
    public Guid HospitalId { get; set; }
    public string? HospitalName { get; set; }
    public string? Address { get; set; }
    public string PotentialLevel { get; set; } = "C";
    public Guid? AssignedSalesId { get; set; }
    public string? AssignedSalesName { get; set; }
    public DateTime CreatedAt { get; set; }
}