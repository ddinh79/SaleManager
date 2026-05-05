using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Entities;

public class I18nVersion
{
    [Key]
    [MaxLength(10)]
    public string Locale { get; set; } = string.Empty;

    public int Version { get; set; } = 1;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}