using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs;
using SalesSystem.Helpers;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/daily-plan")]
public class DailyPlanController : ControllerBase
{
    private readonly IDailyPlanService _dailyPlanService;

    public DailyPlanController(IDailyPlanService dailyPlanService)
    {
        _dailyPlanService = dailyPlanService;
    }

    [HttpGet]
    public async Task<ActionResult<DailyPlanResponse>> GetTodayPlan()
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.GetDailyPlanAsync(userId.Value, DateTime.UtcNow.Date);
        return Ok(result);
    }

    [HttpGet("{date}")]
    public async Task<ActionResult<DailyPlanResponse>> GetPlanForDate(DateTime date)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.GetDailyPlanAsync(userId.Value, date);
        return Ok(result);
    }

    [HttpPost("{taskId}/complete")]
    public async Task<ActionResult<DailyPlanTaskDto>> CompleteTask(Guid taskId, [FromBody] ManualCompleteRequest request)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.CompleteTaskAsync(userId.Value, taskId, request);
        return Ok(result);
    }

    [HttpPost("{taskId}/skip")]
    public async Task<ActionResult<DailyPlanTaskDto>> SkipTask(Guid taskId, [FromBody] SkipTaskRequest request)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.SkipTaskAsync(userId.Value, taskId, request);
        return Ok(result);
    }

    [HttpPost("{taskId}/activate")]
    public async Task<ActionResult<DailyPlanTaskDto>> ActivateTask(Guid taskId)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.ActivateTaskAsync(userId.Value, taskId);
        return Ok(result);
    }

    [HttpGet("capacity")]
    public async Task<ActionResult<CapacityInfo>> GetCapacity()
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.GetCapacityAsync(userId.Value);
        return Ok(result);
    }

    [HttpPut("capacity")]
    public async Task<ActionResult<CapacityInfo>> UpdateCapacity([FromBody] CapacityUpdateRequest request)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.UpdateCapacityAsync(userId.Value, request);
        return Ok(result);
    }

    [HttpGet("team")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult<TeamDailyPlanResponse>> GetTeamPlans([FromQuery] DateTime? date)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null) return Unauthorized();

        var result = await _dailyPlanService.GetTeamPlansAsync(userId.Value, date ?? DateTime.UtcNow.Date);
        return Ok(result);
    }
}