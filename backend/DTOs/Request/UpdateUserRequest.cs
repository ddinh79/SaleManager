using System.ComponentModel.DataAnnotations;

namespace SalesSystem.DTOs.Request;

public class UpdateUserRequest
{
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [MinLength(6)]
    public string? Password { get; set; }

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;

    public Guid? ManagerId { get; set; }

    public string? AvatarUrl { get; set; }
}