using SalesSystem.Entities;

namespace SalesSystem.DTOs;

public class OrderResponse
{
    public Guid Id { get; set; }
    public Guid DealId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class OrderListResponse
{
    public List<OrderResponse> Items { get; set; } = new();
    public int TotalCount { get; set; }
}