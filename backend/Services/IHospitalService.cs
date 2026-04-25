using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IHospitalService
{
    Task<List<HospitalResponse>> GetAllHospitalsAsync();
    Task<HospitalResponse?> GetHospitalByIdAsync(Guid id);
    Task<HospitalResponse> CreateHospitalAsync(CreateHospitalRequest request);
    Task<bool> UpdateHospitalAsync(Guid id, CreateHospitalRequest request);
    Task<bool> DeleteHospitalAsync(Guid id);
}