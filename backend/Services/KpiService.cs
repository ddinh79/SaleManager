using SalesSystem.DTOs.Response;
using SalesSystem.Data;
using SalesSystem.Entities;
using Microsoft.EntityFrameworkCore;

namespace SalesSystem.Services;

public class KpiService : IKpiService
{
    private readonly AppDbContext _context;

    public KpiService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<KpiSummaryResponse> GetUserKpiSummaryAsync(Guid userId)
    {
        var from = DateTime.UtcNow.AddDays(-30);

        var activities = await _context.Activities
            .Where(a => a.SalesId == userId && a.CreatedAt >= from)
            .ToListAsync();

        var deals = await _context.Deals
            .Where(d => d.SalesId == userId && d.CreatedAt >= from)
            .ToListAsync();

        var orders = await _context.Orders
            .Include(o => o.Deal)
            .Where(o => o.Deal.SalesId == userId && o.CreatedAt >= from)
            .ToListAsync();

        var totalCalls = activities.Count(a => a.Type == ActivityType.CALL);
        var totalMeetings = activities.Count(a => a.Type == ActivityType.MEETING);
        var totalDeals = deals.Count;
        var wonDeals = deals.Count(d => d.Stage == DealStage.WON);
        var lostDeals = deals.Count(d => d.Stage == DealStage.LOST);
        var totalRevenue = orders.Where(o => o.Status == OrderStatus.Completed).Sum(o => o.TotalValue);

        var conversionRate = totalDeals > 0 ? (decimal)wonDeals / totalDeals * 100 : 0;
        var activityScore = (totalCalls * 1) + (totalMeetings * 3) + (wonDeals * 5);

        return new KpiSummaryResponse
        {
            TotalCalls = totalCalls,
            TotalMeetings = totalMeetings,
            TotalDeals = totalDeals,
            WonDeals = wonDeals,
            LostDeals = lostDeals,
            TotalRevenue = totalRevenue,
            ConversionRate = Math.Round(conversionRate, 2),
            ActivityScore = activityScore
        };
    }

    public async Task<List<DailyKpiResponse>> GetDailyKpiAsync(Guid userId, DateTime from, DateTime to)
    {
        var activities = await _context.Activities
            .Where(a => a.SalesId == userId && a.CreatedAt >= from && a.CreatedAt <= to)
            .ToListAsync();

        var deals = await _context.Deals
            .Where(d => d.SalesId == userId && d.CreatedAt >= from && d.CreatedAt <= to)
            .ToListAsync();

        var orders = await _context.Orders
            .Include(o => o.Deal)
            .Where(o => o.Deal.SalesId == userId && o.CreatedAt >= from && o.CreatedAt <= to)
            .ToListAsync();

        var days = Enumerable.Range(0, (int)(to - from).TotalDays + 1)
            .Select(d => from.AddDays(d))
            .ToList();

        var result = new List<DailyKpiResponse>();

        foreach (var day in days)
        {
            var dayStart = day.Date;
            var dayEnd = day.Date.AddDays(1);

            var dayActivities = activities.Where(a => a.CreatedAt >= dayStart && a.CreatedAt < dayEnd).ToList();
            var dayDeals = deals.Where(d => d.CreatedAt >= dayStart && d.CreatedAt < dayEnd).ToList();
            var dayOrders = orders.Where(o => o.CreatedAt >= dayStart && o.CreatedAt < dayEnd).ToList();

            result.Add(new DailyKpiResponse
            {
                Date = day.Date,
                Calls = dayActivities.Count(a => a.Type == ActivityType.CALL),
                Meetings = dayActivities.Count(a => a.Type == ActivityType.MEETING),
                NewDeals = dayDeals.Count(d => d.Stage == DealStage.NEW),
                Revenue = dayOrders.Where(o => o.Status == OrderStatus.Completed).Sum(o => o.TotalValue)
            });
        }

        return result;
    }

    public async Task<List<WeeklyKpiResponse>> GetWeeklyKpiAsync(Guid userId, int year)
    {
        var startDate = new DateTime(year, 1, 1);
        var endDate = new DateTime(year, 12, 31);

        var activities = await _context.Activities
            .Where(a => a.SalesId == userId && a.CreatedAt >= startDate && a.CreatedAt <= endDate)
            .ToListAsync();

        var deals = await _context.Deals
            .Where(d => d.SalesId == userId && d.CreatedAt >= startDate && d.CreatedAt <= endDate)
            .ToListAsync();

        var result = new List<WeeklyKpiResponse>();

        for (int week = 1; week <= 52; week++)
        {
            var weekStart = GetStartOfWeek(year, week);
            var weekEnd = weekStart.AddDays(7);

            var weekActivities = activities.Where(a => a.CreatedAt >= weekStart && a.CreatedAt < weekEnd).ToList();
            var weekDeals = deals.Where(d => d.CreatedAt >= weekStart && d.CreatedAt < weekEnd).ToList();

            var calls = weekActivities.Count(a => a.Type == ActivityType.CALL);
            var meetings = weekActivities.Count(a => a.Type == ActivityType.MEETING);
            var wonDeals = weekDeals.Count(d => d.Stage == DealStage.WON);
            var totalDeals = weekDeals.Count;
            var conversionRate = totalDeals > 0 ? (decimal)wonDeals / totalDeals * 100 : 0;

            result.Add(new WeeklyKpiResponse
            {
                WeekNumber = week,
                Calls = calls,
                Meetings = meetings,
                WonDeals = wonDeals,
                ConversionRate = Math.Round(conversionRate, 2)
            });
        }

        return result;
    }

    public async Task<List<MonthlyKpiResponse>> GetMonthlyKpiAsync(Guid userId, int year)
    {
        var startDate = new DateTime(year, 1, 1);
        var endDate = new DateTime(year, 12, 31);

        var deals = await _context.Deals
            .Where(d => d.SalesId == userId && d.CreatedAt >= startDate && d.CreatedAt <= endDate)
            .ToListAsync();

        var orders = await _context.Orders
            .Include(o => o.Deal)
            .Where(o => o.Deal.SalesId == userId && o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .ToListAsync();

        var result = new List<MonthlyKpiResponse>();

        for (int month = 1; month <= 12; month++)
        {
            var monthStart = new DateTime(year, month, 1);
            var monthEnd = monthStart.AddMonths(1);

            var monthDeals = deals.Where(d => d.CreatedAt >= monthStart && d.CreatedAt < monthEnd).ToList();
            var monthOrders = orders.Where(o => o.CreatedAt >= monthStart && o.CreatedAt < monthEnd).ToList();

            var revenue = monthOrders.Where(o => o.Status == OrderStatus.Completed).Sum(o => o.TotalValue);
            var avgDealSize = monthDeals.Any() ? monthDeals.Average(d => d.Value) : 0;

            result.Add(new MonthlyKpiResponse
            {
                Month = month,
                Year = year,
                Revenue = revenue,
                TargetPercent = 0,
                AvgDealSize = Math.Round(avgDealSize, 2)
            });
        }

        return result;
    }

    public async Task<decimal> GetTotalRevenueAsync(Guid userId, DateTime from, DateTime to)
    {
        var orders = await _context.Orders
            .Include(o => o.Deal)
            .Where(o => o.Deal.SalesId == userId && o.CreatedAt >= from && o.CreatedAt <= to)
            .ToListAsync();

        return orders.Where(o => o.Status == OrderStatus.Completed).Sum(o => o.TotalValue);
    }

    public async Task<int> GetTotalCallsAsync(Guid userId, DateTime from, DateTime to)
    {
        return await _context.Activities
            .CountAsync(a => a.SalesId == userId && a.Type == ActivityType.CALL && a.CreatedAt >= from && a.CreatedAt <= to);
    }

    public async Task<int> GetTotalMeetingsAsync(Guid userId, DateTime from, DateTime to)
    {
        return await _context.Activities
            .CountAsync(a => a.SalesId == userId && a.Type == ActivityType.MEETING && a.CreatedAt >= from && a.CreatedAt <= to);
    }

    private static DateTime GetStartOfWeek(int year, int week)
    {
        var jan1 = new DateTime(year, 1, 1);
        var daysOffset = (DayOfWeek.Thursday - jan1.DayOfWeek + 7) % 7;
        var firstThursday = jan1.AddDays(-daysOffset + 7 * (week - 1));
        var weekStart = firstThursday.AddDays(-3);
        return weekStart.Date;
    }
}