using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Entities;

public class Translation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid TranslationKeyId { get; set; }

    [Required]
    [MaxLength(10)]
    public string Locale { get; set; } = "en";

    [Required]
    [MaxLength(4000)]
    public string Value { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public TranslationKey TranslationKey { get; set; } = null!;
}