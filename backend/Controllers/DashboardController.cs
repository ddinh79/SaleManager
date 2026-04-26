using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    private Guid GetCurrentUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private string GetCurrentUserRole() => User.FindFirst(ClaimTypes.Role)!.Value;

    [HttpGet("ceo")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetCEODashboard()
    {
        var result = await _dashboardService.GetCEODashboardAsync();
        return Ok(result);
    }

    [HttpGet("manager")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult> GetManagerDashboard()
    {
        var managerId = GetCurrentUserId();
        var result = await _dashboardService.GetManagerDashboardAsync(managerId);
        return Ok(result);
    }

    [HttpGet("sales")]
    [Authorize(Roles = "Admin,SalesManager,SalesMember")]
    public async Task<ActionResult> GetSalesDashboard()
    {
        var salesId = GetCurrentUserId();
        var result = await _dashboardService.GetSalesDashboardAsync(salesId);
        return Ok(result);
    }
}