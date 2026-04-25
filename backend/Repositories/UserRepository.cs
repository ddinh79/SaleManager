using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByUsernameWithManagerAsync(string username)
    {
        return await _dbSet
            .Include(u => u.Manager)
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<IEnumerable<User>> GetSalesMembersAsync()
    {
        return await _dbSet
            .Where(u => u.Role == UserRole.SalesMember && u.IsActive)
            .ToListAsync();
    }

    public async Task<IEnumerable<User>> GetSalesMembersByManagerIdAsync(Guid managerId)
    {
        return await _dbSet
            .Where(u => u.Role == UserRole.SalesMember && u.ManagerId == managerId && u.IsActive)
            .ToListAsync();
    }

    public async Task<IEnumerable<User>> GetManagersAsync()
    {
        return await _dbSet
            .Where(u => u.Role == UserRole.SalesManager && u.IsActive)
            .ToListAsync();
    }
}