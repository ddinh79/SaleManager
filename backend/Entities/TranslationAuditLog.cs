using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class TranslationAuditLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TranslationKeyId { get; set; }

    [Required]
    [MaxLength(10)]
    public string Locale { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    [Required]
    public string NewValue { get; set; } = string.Empty;

    [Required]
    public Guid UserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}