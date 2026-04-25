using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByUsernameWithManagerAsync(string username);
    Task<IEnumerable<User>> GetSalesMembersAsync();
    Task<IEnumerable<User>> GetSalesMembersByManagerIdAsync(Guid managerId);
    Task<IEnumerable<User>> GetManagersAsync();
}