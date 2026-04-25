using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivitiesController(IActivityService activityService)
    {
        _activityService = activityService;
    }

    [HttpPost]
    public async Task<ActionResult<ActivityResponse>> Create([FromBody] CreateActivityRequest request)
    {
        try
        {
            var salesId = GetCurrentUserId();
            var result = await _activityService.CreateAsync(request, salesId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<ActivityResponse>>> GetFiltered(
        [FromQuery] Guid? doctorId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? type)
    {
        var salesId = GetCurrentUserId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        Guid? filterSalesId = salesId;
        if (role == "Admin")
        {
            filterSalesId = null; // Admin sees all
        }
        // For Manager and Sales, filterSalesId = salesId (own activities only for now)

        var result = await _activityService.GetFilteredAsync(filterSalesId, doctorId, from, to, type);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ActivityResponse>> GetById(Guid id)
    {
        var result = await _activityService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("timeline")]
    public async Task<ActionResult<List<ActivityResponse>>> GetTimeline([FromQuery] Guid? doctorId)
    {
        var salesId = GetCurrentUserId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        Guid? filterSalesId = salesId;
        if (role == "Admin")
        {
            filterSalesId = null;
        }

        var result = await _activityService.GetFilteredAsync(filterSalesId, doctorId, null, null, null);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(claim ?? throw new UnauthorizedAccessException());
    }
}