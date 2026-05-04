using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IDealRepository : IRepository<Deal>
{
    Task<Deal?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<Deal>> GetBySalesIdAsync(Guid salesId, int limit = 50, int offset = 0);
    Task<IEnumerable<Deal>> GetByTeamSalesIdsAsync(IEnumerable<Guid> salesIds, int limit = 50, int offset = 0);
    Task<IEnumerable<Deal>> GetAllWithDetailsAsync(int limit = 50, int offset = 0);
    Task<int> GetCountBySalesIdAsync(Guid salesId);
    Task<int> GetCountByTeamSalesIdsAsync(IEnumerable<Guid> salesIds);
    Task<int> GetCountAllAsync();
    Task<int> GetMaxPositionInStageAsync(DealStage stage);
    Task<List<Deal>> GetByStageAsync(DealStage stage, int limit = 50, int offset = 0);
}