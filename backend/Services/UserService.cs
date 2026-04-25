using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Helpers;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class UserService : IUserService
{
    private readonly IRepository<User> _userRepository;

    public UserService(IRepository<User> userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserResponse>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapToUserResponse).ToList();
    }

    public async Task<UserResponse?> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return null;
        }

        return MapToUserResponse(user);
    }

    public async Task<UserResponse> RegisterAsync(RegisterRequest request)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = PasswordHelper.HashPassword(request.Password),
            FullName = request.FullName,
            Role = Enum.Parse<UserRole>(request.Role),
            ManagerId = request.ManagerId,
            AvatarUrl = request.AvatarUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };

        await _userRepository.AddAsync(user);

        return MapToUserResponse(user);
    }

    public async Task<bool> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return false;
        }

        user.Username = request.Username;
        user.Email = request.Email;
        user.FullName = request.FullName;
        user.Role = Enum.Parse<UserRole>(request.Role);
        user.ManagerId = request.ManagerId;
        user.AvatarUrl = request.AvatarUrl;
        user.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = PasswordHelper.HashPassword(request.Password);
        }

        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            return false;
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);
        return true;
    }

    public async Task<List<UserResponse>> GetSalesMembersAsync()
    {
        var users = await _userRepository.FindAsync(u => u.Role == UserRole.SalesMember && u.IsActive);
        return users.Select(MapToUserResponse).ToList();
    }

    public async Task<List<UserResponse>> GetSalesMembersByManagerIdAsync(Guid managerId)
    {
        var users = await _userRepository.FindAsync(u => u.ManagerId == managerId && u.Role == UserRole.SalesMember && u.IsActive);
        return users.Select(MapToUserResponse).ToList();
    }

    public async Task<List<UserResponse>> GetManagersAsync()
    {
        var users = await _userRepository.FindAsync(u => u.Role == UserRole.SalesManager && u.IsActive);
        return users.Select(MapToUserResponse).ToList();
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
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt,
            IsActive = user.IsActive
        };
    }
}