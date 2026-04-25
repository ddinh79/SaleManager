using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IDoctorService
{
    Task<PaginatedResponse<DoctorResponse>> GetDoctorsAsync(int page, int pageSize, string? search, string? potentialLevel, Guid? hospitalId);
    Task<DoctorResponse?> GetDoctorByIdAsync(Guid id);
    Task<DoctorResponse> CreateDoctorAsync(CreateDoctorRequest request);
    Task<bool> UpdateDoctorAsync(Guid id, UpdateDoctorRequest request);
    Task<bool> DeleteDoctorAsync(Guid id);
    Task<List<DoctorResponse>> GetAssignedDoctorsAsync(Guid salesId);
    Task<bool> AssignDoctorToSalesAsync(Guid doctorId, Guid? salesId);
}