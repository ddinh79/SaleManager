using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<OrderListResponse>> GetOrders([FromQuery] string? status = null, [FromQuery] Guid? doctorId = null)
    {
        OrderStatus? orderStatus = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var parsed))
        {
            orderStatus = parsed;
        }

        var result = await _orderService.GetOrdersAsync(orderStatus, doctorId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderResponse>> GetOrder(Guid id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<OrderResponse>> ApproveOrder(Guid id)
    {
        try
        {
            var order = await _orderService.ApproveOrderAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/ready")]
    public async Task<ActionResult<OrderResponse>> MarkReadyToShip(Guid id)
    {
        try
        {
            var order = await _orderService.MarkReadyToShipAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/ship")]
    public async Task<ActionResult<OrderResponse>> ShipOrder(Guid id)
    {
        try
        {
            var order = await _orderService.ShipOrderAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<OrderResponse>> CompleteOrder(Guid id)
    {
        try
        {
            var order = await _orderService.CompleteOrderAsync(id);
            if (order == null) return NotFound();
            return Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}