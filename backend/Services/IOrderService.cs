using SalesSystem.DTOs;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public interface IOrderService
{
    Task<OrderListResponse> GetOrdersAsync(OrderStatus? status = null, Guid? doctorId = null);
    Task<OrderResponse?> GetOrderByIdAsync(Guid id);
    Task<OrderResponse?> ApproveOrderAsync(Guid id);
    Task<OrderResponse?> MarkReadyToShipAsync(Guid id);
    Task<OrderResponse?> ShipOrderAsync(Guid id);
    Task<OrderResponse?> CompleteOrderAsync(Guid id);
}