using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IActivityService
{
    Task<ActivityResponse> CreateAsync(CreateActivityRequest request, Guid salesId);
    Task<List<ActivityResponse>> GetFilteredAsync(Guid? salesId, Guid? doctorId, DateTime? from, DateTime? to, string? type);
    Task<ActivityResponse?> GetByIdAsync(Guid id);
}