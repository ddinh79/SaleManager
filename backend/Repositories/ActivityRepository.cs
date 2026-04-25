using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class ActivityRepository : Repository<Activity>, IActivityRepository
{
    public ActivityRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Activity>> GetBySalesIdAsync(Guid salesId)
    {
        return await _context.Activities
            .Where(a => a.SalesId == salesId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Activity>> GetByDoctorIdAsync(Guid doctorId)
    {
        return await _context.Activities
            .Where(a => a.DoctorId == doctorId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Activity>> GetFilteredAsync(Guid? salesId, Guid? doctorId, DateTime? from, DateTime? to, ActivityType? type)
    {
        var query = _context.Activities
            .Include(a => a.Sales)
            .Include(a => a.Doctor)
            .AsQueryable();

        if (salesId.HasValue)
            query = query.Where(a => a.SalesId == salesId.Value);

        if (doctorId.HasValue)
            query = query.Where(a => a.DoctorId == doctorId.Value);

        if (from.HasValue)
            query = query.Where(a => a.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(a => a.CreatedAt <= to.Value);

        if (type.HasValue)
            query = query.Where(a => a.Type == type.Value);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}