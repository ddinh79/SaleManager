using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class DealRepository : Repository<Deal>, IDealRepository
{
    public DealRepository(AppDbContext context) : base(context) { }

    public async Task<Deal?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .Include(d => d.Doctor.Hospital)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<IEnumerable<Deal>> GetBySalesIdAsync(Guid salesId, int limit = 50, int offset = 0)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Doctor.Hospital)
            .Where(d => d.SalesId == salesId)
            .OrderBy(d => d.Position)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<IEnumerable<Deal>> GetByTeamSalesIdsAsync(IEnumerable<Guid> salesIds, int limit = 50, int offset = 0)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Doctor.Hospital)
            .Where(d => salesIds.Contains(d.SalesId))
            .OrderBy(d => d.Position)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<IEnumerable<Deal>> GetAllWithDetailsAsync(int limit = 50, int offset = 0)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .Include(d => d.Doctor.Hospital)
            .OrderBy(d => d.Position)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetCountBySalesIdAsync(Guid salesId)
    {
        return await _dbSet.CountAsync(d => d.SalesId == salesId);
    }

    public async Task<int> GetCountByTeamSalesIdsAsync(IEnumerable<Guid> salesIds)
    {
        return await _dbSet.CountAsync(d => salesIds.Contains(d.SalesId));
    }

    public async Task<int> GetCountAllAsync()
    {
        return await _dbSet.CountAsync();
    }

    public async Task<int> GetMaxPositionInStageAsync(DealStage stage)
    {
        var max = await _dbSet
            .Where(d => d.Stage == stage)
            .MaxAsync(d => (int?)d.Position) ?? 0;
        return max;
    }

    public async Task<IEnumerable<Deal>> GetAllForMetricsAsync()
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Doctor.Hospital)
            .ToListAsync();
    }

    public async Task<IEnumerable<Deal>> GetAllBySalesIdForMetricsAsync(Guid salesId)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Doctor.Hospital)
            .Where(d => d.SalesId == salesId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Deal>> GetAllByTeamSalesIdsForMetricsAsync(IEnumerable<Guid> salesIds)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Doctor.Hospital)
            .Where(d => salesIds.Contains(d.SalesId))
            .ToListAsync();
    }

    public async Task<List<Deal>> GetByStageAsync(DealStage stage, int limit = 50, int offset = 0)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Doctor.Hospital)
            .Include(d => d.Sales)
            .Where(d => d.Stage == stage)
            .OrderBy(d => d.Position)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();
    }
}