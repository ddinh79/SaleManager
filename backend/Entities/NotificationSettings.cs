using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class NotificationSettings
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public bool FollowUpReminderEnabled { get; set; } = true;
    public bool DealClosingEnabled { get; set; } = true;
    public bool InactiveAlertEnabled { get; set; } = true;
}