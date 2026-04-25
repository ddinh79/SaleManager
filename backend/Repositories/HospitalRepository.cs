using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class HospitalRepository : Repository<Hospital>, IHospitalRepository
{
    public HospitalRepository(AppDbContext context) : base(context) { }

    public async Task<Hospital?> GetByIdWithDoctorsAsync(Guid id)
    {
        return await _dbSet
            .Include(h => h.Doctors)
            .FirstOrDefaultAsync(h => h.Id == id);
    }
}