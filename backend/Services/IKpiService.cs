using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface IKpiService
{
    Task<KpiSummaryResponse> GetUserKpiSummaryAsync(Guid userId);
    Task<List<DailyKpiResponse>> GetDailyKpiAsync(Guid userId, DateTime from, DateTime to);
    Task<List<WeeklyKpiResponse>> GetWeeklyKpiAsync(Guid userId, int year);
    Task<List<MonthlyKpiResponse>> GetMonthlyKpiAsync(Guid userId, int year);
    Task<decimal> GetTotalRevenueAsync(Guid userId, DateTime from, DateTime to);
    Task<int> GetTotalCallsAsync(Guid userId, DateTime from, DateTime to);
    Task<int> GetTotalMeetingsAsync(Guid userId, DateTime from, DateTime to);
}