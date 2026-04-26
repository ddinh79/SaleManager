using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IDealRepository : IRepository<Deal>
{
    Task<Deal?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<Deal>> GetBySalesIdAsync(Guid salesId);
    Task<IEnumerable<Deal>> GetByTeamSalesIdsAsync(IEnumerable<Guid> salesIds);
    Task<IEnumerable<Deal>> GetAllWithDetailsAsync();
}