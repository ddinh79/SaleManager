using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class DoctorRepository : Repository<Doctor>, IDoctorRepository
{
    public DoctorRepository(AppDbContext context) : base(context) { }

    public async Task<Doctor?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(d => d.Hospital)
            .Include(d => d.AssignedSales)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Doctor?> GetByPhoneAsync(string phone)
    {
        return await _dbSet.FirstOrDefaultAsync(d => d.Phone == phone);
    }

    public async Task<IEnumerable<Doctor>> GetByAssignedSalesIdAsync(Guid salesId)
    {
        return await _dbSet
            .Where(d => d.AssignedSalesId == salesId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Doctor>> GetAllWithDetailsAsync(int page, int pageSize, string? search, string? potentialLevel, Guid? hospitalId)
    {
        var query = _dbSet
            .Include(d => d.Hospital)
            .Include(d => d.AssignedSales)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(d => d.Name.Contains(search) || d.Phone.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(potentialLevel) && Enum.TryParse<PotentialLevel>(potentialLevel, out var level))
        {
            query = query.Where(d => d.PotentialLevel == level);
        }

        if (hospitalId.HasValue)
        {
            query = query.Where(d => d.HospitalId == hospitalId.Value);
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetTotalCountAsync(string? search, string? potentialLevel, Guid? hospitalId)
    {
        var query = _dbSet.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(d => d.Name.Contains(search) || d.Phone.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(potentialLevel) && Enum.TryParse<PotentialLevel>(potentialLevel, out var level))
        {
            query = query.Where(d => d.PotentialLevel == level);
        }

        if (hospitalId.HasValue)
        {
            query = query.Where(d => d.HospitalId == hospitalId.Value);
        }

        return await query.CountAsync();
    }
}