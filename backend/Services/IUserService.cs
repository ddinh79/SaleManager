using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IUserService
{
    Task<List<UserResponse>> GetAllUsersAsync();
    Task<UserResponse?> GetUserByIdAsync(Guid id);
    Task<UserResponse> RegisterAsync(RegisterRequest request);
    Task<bool> UpdateUserAsync(Guid id, UpdateUserRequest request);
    Task<bool> DeleteUserAsync(Guid id);
    Task<List<UserResponse>> GetSalesMembersAsync();
    Task<List<UserResponse>> GetSalesMembersByManagerIdAsync(Guid managerId);
    Task<List<UserResponse>> GetManagersAsync();
}