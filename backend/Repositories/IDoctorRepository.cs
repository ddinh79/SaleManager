using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IDoctorRepository : IRepository<Doctor>
{
    Task<Doctor?> GetByIdWithDetailsAsync(Guid id);
    Task<Doctor?> GetByPhoneAsync(string phone);
    Task<IEnumerable<Doctor>> GetByAssignedSalesIdAsync(Guid salesId);
    Task<IEnumerable<Doctor>> GetAllWithDetailsAsync(int page, int pageSize, string? search, string? potentialLevel, Guid? hospitalId);
    Task<int> GetTotalCountAsync(string? search, string? potentialLevel, Guid? hospitalId);
}