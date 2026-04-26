using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace SalesSystem.Entities;

[Index(nameof(UserId), nameof(Type), nameof(Date), IsUnique = true)]
public class NotificationDedup
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public NotificationType Type { get; set; }

    public DateTime Date { get; set; }  // date-only (UTC), stripped of time
}