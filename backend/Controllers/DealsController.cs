using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SalesSystem.DTOs;
using SalesSystem.Hubs;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DealsController : ControllerBase
{
    private readonly IDealService _dealService;
    private readonly IHubContext<DealHub> _dealHubContext;

    public DealsController(IDealService dealService, IHubContext<DealHub> dealHubContext)
    {
        _dealService = dealService;
        _dealHubContext = dealHubContext;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpPost]
    public async Task<ActionResult<DealResponse>> CreateDeal([FromBody] CreateDealRequest request)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var deal = await _dealService.CreateDealAsync(request, salesId);
            return CreatedAtAction(nameof(GetDeal), new { id = deal.Id }, deal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DealResponse>> GetDeal(Guid id)
    {
        var deal = await _dealService.GetDealByIdAsync(id);
        if (deal == null) return NotFound();
        return Ok(deal);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DealResponse>> UpdateDeal(Guid id, [FromBody] UpdateDealRequest request)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            var deal = await _dealService.UpdateDealAsync(id, request, salesId, role);
            if (deal == null) return NotFound();
            return Ok(deal);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDeal(Guid id)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            var result = await _dealService.DeleteDealAsync(id, salesId, role);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("pipeline")]
    public async Task<ActionResult<PipelineResponse>> GetPipeline([FromQuery] int limit = 50)
    {
        var role = GetCurrentUserRole();
        var userId = GetCurrentUserId();
        var result = await _dealService.GetPipelineAsync(null, role, userId, limit);
        return Ok(result);
    }

    [HttpGet("forecast")]
    public async Task<ActionResult<ForecastResponse>> GetForecast()
    {
        var result = await _dealService.GetForecastAsync();
        return Ok(result);
    }

    [HttpPut("{id}/stage")]
    public async Task<ActionResult<DealResponse>> UpdateStage(Guid id, [FromBody] UpdateStageRequest request)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            var deal = await _dealService.UpdateStageAsync(id, request, salesId, role);
            if (deal == null) return NotFound();
            return Ok(deal);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.StartsWith("CONCURRENCY_CONFLICT"))
                return Conflict(ex.Message);
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/rebalance")]
    public async Task<ActionResult> RebalanceStage(Guid id, [FromQuery] string stage)
    {
        try
        {
            if (!Enum.TryParse<Entities.DealStage>(stage, out var dealStage))
                return BadRequest("Invalid stage");

            await _dealService.RebalanceStageAsync(dealStage);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}