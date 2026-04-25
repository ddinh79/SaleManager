using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Helpers;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByUsernameWithManagerAsync(request.Username);

        if (user == null || !user.IsActive || !PasswordHelper.VerifyPassword(request.Password, user.PasswordHash))
        {
            return null;
        }

        var jwtKey = _configuration["Jwt:Key"] ?? string.Empty;
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? string.Empty;
        var jwtAudience = _configuration["Jwt:Audience"] ?? string.Empty;
        var expiryHours = int.Parse(_configuration["Jwt:ExpiryInHours"] ?? "24");

        var token = JwtHelper.GenerateToken(user, jwtKey, jwtIssuer, jwtAudience, expiryHours);

        return new LoginResponse
        {
            Token = token,
            User = MapToUserResponse(user)
        };
    }

    public async Task<UserResponse?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        return MapToUserResponse(user);
    }

    private UserResponse MapToUserResponse(User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role.ToString(),
            ManagerId = user.ManagerId,
            ManagerName = user.Manager?.FullName,
            CreatedAt = user.CreatedAt,
            IsActive = user.IsActive
        };
    }
}