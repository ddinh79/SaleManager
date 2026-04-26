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

    public async Task<IEnumerable<Deal>> GetBySalesIdAsync(Guid salesId)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Where(d => d.SalesId == salesId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Deal>> GetByTeamSalesIdsAsync(IEnumerable<Guid> salesIds)
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Where(d => salesIds.Contains(d.SalesId))
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Deal>> GetAllWithDetailsAsync()
    {
        return await _dbSet
            .Include(d => d.Doctor)
            .Include(d => d.Sales)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }
}