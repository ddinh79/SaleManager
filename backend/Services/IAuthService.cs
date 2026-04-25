using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<UserResponse?> GetCurrentUserAsync(Guid userId);
}