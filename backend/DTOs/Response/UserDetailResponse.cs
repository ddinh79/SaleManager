namespace SalesSystem.DTOs.Response;

public class UserDetailResponse : UserResponse
{
    public List<DoctorResponse> AssignedDoctors { get; set; } = new();
    public KpiSummaryResponse Kpi { get; set; } = new();
    public int TotalDeals { get; set; }
    public int ActiveDeals { get; set; }
    public int TotalActivities { get; set; }
}