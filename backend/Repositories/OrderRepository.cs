using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(AppDbContext context) : base(context) { }

    public async Task<Order?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(o => o.Deal)
            .Include(o => o.Doctor)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<IEnumerable<Order>> GetAllWithDetailsAsync()
    {
        return await _dbSet
            .Include(o => o.Doctor)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status)
    {
        return await _dbSet
            .Include(o => o.Doctor)
            .Where(o => o.Status == status)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Order>> GetByDoctorIdAsync(Guid doctorId)
    {
        return await _dbSet
            .Include(o => o.Doctor)
            .Where(o => o.DoctorId == doctorId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }
}