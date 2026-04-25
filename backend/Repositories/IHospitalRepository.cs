using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IHospitalRepository : IRepository<Hospital>
{
    Task<Hospital?> GetByIdWithDoctorsAsync(Guid id);
}