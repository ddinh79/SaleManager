using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Response;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KpiController : ControllerBase
{
    private readonly IKpiService _kpiService;

    public KpiController(IKpiService kpiService)
    {
        _kpiService = kpiService;
    }

    [HttpGet("users/{userId}/summary")]
    public async Task<ActionResult<KpiSummaryResponse>> GetUserKpiSummary(Guid userId)
    {
        var kpi = await _kpiService.GetUserKpiSummaryAsync(userId);
        return Ok(kpi);
    }

    [HttpGet("users/{userId}/daily")]
    public async Task<ActionResult<List<DailyKpiResponse>>> GetDailyKpi(Guid userId, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;
        var kpi = await _kpiService.GetDailyKpiAsync(userId, fromDate, toDate);
        return Ok(kpi);
    }

    [HttpGet("users/{userId}/weekly")]
    public async Task<ActionResult<List<WeeklyKpiResponse>>> GetWeeklyKpi(Guid userId, [FromQuery] int? year = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var kpi = await _kpiService.GetWeeklyKpiAsync(userId, targetYear);
        return Ok(kpi);
    }

    [HttpGet("users/{userId}/monthly")]
    public async Task<ActionResult<List<MonthlyKpiResponse>>> GetMonthlyKpi(Guid userId, [FromQuery] int? year = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var kpi = await _kpiService.GetMonthlyKpiAsync(userId, targetYear);
        return Ok(kpi);
    }

    [HttpGet("users/{userId}/revenue")]
    public async Task<ActionResult<decimal>> GetRevenue(Guid userId, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var fromDate = from ?? DateTime.UtcNow.AddDays(-30);
        var toDate = to ?? DateTime.UtcNow;
        var revenue = await _kpiService.GetTotalRevenueAsync(userId, fromDate, toDate);
        return Ok(revenue);
    }
}