using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class TranslationMissingLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = string.Empty;
    public string Locale { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}