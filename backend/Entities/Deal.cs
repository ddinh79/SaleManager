using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SalesSystem.Entities;

public class Deal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public Guid SalesId { get; set; }
    public User Sales { get; set; } = null!;

    public ProductType Product { get; set; }

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [NotMapped]
    public decimal TotalValue => Quantity * UnitPrice;

    // Deprecated: kept for migration compatibility
    public decimal Value { get; set; }

    public DateTime ExpectedCloseDate { get; set; }

    public int Probability { get; set; }

    public DealStage Stage { get; set; } = DealStage.NEW;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Order? Order { get; set; }
}
