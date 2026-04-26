using SalesSystem.DTOs;

namespace SalesSystem.Services;

public interface IDashboardService
{
    Task<CEODashboardResponse> GetCEODashboardAsync();
    Task<ManagerDashboardResponse> GetManagerDashboardAsync(Guid managerId);
    Task<SalesDashboardResponse> GetSalesDashboardAsync(Guid salesId);
}