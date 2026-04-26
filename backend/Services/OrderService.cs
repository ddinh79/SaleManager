using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepo;

    public OrderService(IOrderRepository orderRepo)
    {
        _orderRepo = orderRepo;
    }

    public async Task<OrderListResponse> GetOrdersAsync(OrderStatus? status = null, Guid? doctorId = null)
    {
        IEnumerable<Order> orders;

        if (status.HasValue)
        {
            orders = await _orderRepo.GetByStatusAsync(status.Value);
        }
        else if (doctorId.HasValue)
        {
            orders = await _orderRepo.GetByDoctorIdAsync(doctorId.Value);
        }
        else
        {
            orders = await _orderRepo.GetAllWithDetailsAsync();
        }

        var items = orders.Select(MapToOrderResponse).ToList();
        return new OrderListResponse { Items = items, TotalCount = items.Count };
    }

    public async Task<OrderResponse?> GetOrderByIdAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;
        return MapToOrderResponse(order);
    }

    public async Task<OrderResponse?> ApproveOrderAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;

        if (order.Status != OrderStatus.PENDING_APPROVAL)
            throw new InvalidOperationException("Order must be PENDING_APPROVAL to approve");

        order.Status = OrderStatus.APPROVED;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(order);

        return MapToOrderResponse(order);
    }

    public async Task<OrderResponse?> MarkReadyToShipAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;

        if (order.Status != OrderStatus.APPROVED)
            throw new InvalidOperationException("Order must be APPROVED to mark ready to ship");

        order.Status = OrderStatus.READY_TO_SHIP;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(order);

        return MapToOrderResponse(order);
    }

    public async Task<OrderResponse?> ShipOrderAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;

        if (order.Status != OrderStatus.READY_TO_SHIP)
            throw new InvalidOperationException("Order must be READY_TO_SHIP to ship");

        order.Status = OrderStatus.SHIPPED;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(order);

        return MapToOrderResponse(order);
    }

    public async Task<OrderResponse?> CompleteOrderAsync(Guid id)
    {
        var order = await _orderRepo.GetByIdWithDetailsAsync(id);
        if (order == null) return null;

        if (order.Status != OrderStatus.SHIPPED)
            throw new InvalidOperationException("Order must be SHIPPED to complete");

        order.Status = OrderStatus.COMPLETED;
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(order);

        return MapToOrderResponse(order);
    }

    private OrderResponse MapToOrderResponse(Order order)
    {
        return new OrderResponse
        {
            Id = order.Id,
            DealId = order.DealId,
            DoctorId = order.DoctorId,
            DoctorName = order.Doctor?.Name ?? "",
            Product = order.Product.ToString(),
            Quantity = order.Quantity,
            Price = order.Price,
            TotalAmount = order.TotalValue,
            Status = order.Status.ToString(),
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt
        };
    }
}