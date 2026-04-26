using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Entities;

public class Notification
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    public Guid? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }  // "Deal", "Doctor", "User"

    public bool IsRead { get; set; } = false;

    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
