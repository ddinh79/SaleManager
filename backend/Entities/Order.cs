using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class Order
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DealId { get; set; }
    public Deal Deal { get; set; } = null!;

    public Guid DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public ProductType Product { get; set; }

    public int Quantity { get; set; }

    public decimal Price { get; set; }

    public decimal TotalValue { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
