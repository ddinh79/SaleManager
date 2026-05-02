using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;
    private readonly IDealRepository _dealRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IUserRepository _userRepo;

    public DashboardService(
        AppDbContext context,
        IDealRepository dealRepo,
        IOrderRepository orderRepo,
        IDoctorRepository doctorRepo,
        IUserRepository userRepo)
    {
        _context = context;
        _dealRepo = dealRepo;
        _orderRepo = orderRepo;
        _doctorRepo = doctorRepo;
        _userRepo = userRepo;
    }

    public async Task<CEODashboardResponse> GetCEODashboardAsync()
    {
        var allDeals = await _dealRepo.GetAllWithDetailsAsync();
        var completedOrders = await _orderRepo.FindAsync(o => o.Status == OrderStatus.COMPLETED);

        var totalRevenue = completedOrders.Sum(o => o.TotalValue);
        var activeDeals = allDeals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST).ToList();
        var wonDeals = allDeals.Where(d => d.Stage == DealStage.WON).ToList();
        var pipelineValue = activeDeals.Sum(d => d.TotalValue);
        var totalDealsCount = allDeals.Count();
        var conversionRate = totalDealsCount > 0 ? (wonDeals.Count * 100.0m / totalDealsCount) : 0m;
        var weightedForecast = activeDeals.Sum(d => d.TotalValue * d.Probability / 100.0m);

        var topDoctors = allDeals
            .Where(d => d.Stage == DealStage.WON)
            .GroupBy(d => d.Doctor)
            .Select(g => new TopDoctorItem
            {
                Id = g.Key.Id,
                Name = g.Key.Name,
                Hospital = g.Key.Hospital?.Name ?? "",
                TotalValue = g.Sum(d => d.TotalValue)
            })
            .OrderByDescending(x => x.TotalValue)
            .Take(5)
            .ToList();

        var revenueBySales = wonDeals
            .GroupBy(d => d.Sales)
            .Select(g => new RevenueBySalesItem
            {
                SalesId = g.Key.Id,
                SalesName = g.Key.FullName,
                Revenue = g.Sum(d => d.TotalValue),
                DealsWon = g.Count()
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        return new CEODashboardResponse
        {
            TotalRevenue = totalRevenue,
            PipelineValue = pipelineValue,
            WeightedForecast = weightedForecast,
            ConversionRate = Math.Round(conversionRate, 1),
            TotalDeals = allDeals.Count(),
            WonDeals = wonDeals.Count,
            ActiveDeals = activeDeals.Count,
            TopDoctors = topDoctors,
            RevenueBySales = revenueBySales
        };
    }

    public async Task<ManagerDashboardResponse> GetManagerDashboardAsync(Guid managerId)
    {
        var teamSales = await _userRepo.FindAsync(u => u.ManagerId == managerId);
        var salesIds = teamSales.Select(u => u.Id).ToList();

        var teamDeals = await _dealRepo.GetByTeamSalesIdsAsync(salesIds);
        var activeDeals = teamDeals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST).ToList();
        var wonDeals = teamDeals.Where(d => d.Stage == DealStage.WON).ToList();

        var cutoffDate = DateTime.UtcNow.AddDays(-5);
        var inactiveSalesList = new List<InactiveSalesItem>();
        foreach (var u in teamSales)
        {
            var hasRecentActivity = await _context.Activities.AnyAsync(a => a.CreatedAt >= cutoffDate && a.SalesId == u.Id);
            if (!hasRecentActivity)
            {
                var lastActivity = await _context.Activities.Where(a => a.SalesId == u.Id).OrderByDescending(a => a.CreatedAt).Select(a => a.CreatedAt).FirstOrDefaultAsync();
                var daysInactive = lastActivity == default ? (int)(DateTime.UtcNow - u.CreatedAt).TotalDays : (int)(DateTime.UtcNow - lastActivity).TotalDays;
                inactiveSalesList.Add(new InactiveSalesItem
                {
                    Id = u.Id,
                    Name = u.FullName,
                    LastActivity = lastActivity == default ? u.CreatedAt : lastActivity,
                    DaysInactive = daysInactive
                });
            }
        }

        var teamPerformanceList = new List<TeamPerformanceItem>();
        foreach (var s in teamSales)
        {
            var tasksCompleted = await _context.Activities.CountAsync(a => a.SalesId == s.Id);
            teamPerformanceList.Add(new TeamPerformanceItem
            {
                SalesId = s.Id,
                SalesName = s.FullName,
                DealsWon = wonDeals.Count(d => d.SalesId == s.Id),
                Revenue = wonDeals.Where(d => d.SalesId == s.Id).Sum(d => d.TotalValue),
                TasksCompleted = tasksCompleted
            });
        }

        var endOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, DateTime.DaysInMonth(DateTime.UtcNow.Year, DateTime.UtcNow.Month));
        var dealsClosingSoonList = activeDeals
            .Where(d => d.ExpectedCloseDate <= endOfMonth)
            .OrderBy(d => d.ExpectedCloseDate)
            .Select(d => new DealClosingSoonItem
            {
                DealId = d.Id,
                DealName = d.Doctor?.Name ?? "",
                TotalValue = d.TotalValue,
                ExpectedCloseDate = d.ExpectedCloseDate,
                SalesName = d.Sales?.FullName ?? "",
                HospitalName = d.Doctor?.Hospital?.Name ?? ""
            })
            .ToList();

        return new ManagerDashboardResponse
        {
            TeamSize = teamSales.Count(),
            TeamPipelineValue = activeDeals.Sum(d => d.TotalValue),
            TeamWeightedForecast = activeDeals.Sum(d => d.TotalValue * d.Probability / 100.0m),
            DealsClosingSoon = dealsClosingSoonList,
            DealsClosingSoonCount = dealsClosingSoonList.Count,
            InactiveSalesMembers = inactiveSalesList,
            TeamPerformance = teamPerformanceList
        };
    }

    public async Task<SalesDashboardResponse> GetSalesDashboardAsync(Guid salesId)
    {
        var sales = await _userRepo.GetByIdAsync(salesId);
        var salesDeals = await _dealRepo.GetBySalesIdAsync(salesId);
        var activeDeals = salesDeals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST).ToList();
        var wonDeals = salesDeals.Where(d => d.Stage == DealStage.WON).ToList();

        var completedOrders = await _orderRepo.FindAsync(o => o.Status == OrderStatus.COMPLETED && o.Deal != null && o.Deal.SalesId == salesId);
        var myRevenue = completedOrders.Sum(o => o.TotalValue);

        var recentActivitiesQuery = await _context.Activities
            .Where(a => a.SalesId == salesId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .ToListAsync();

        var recentActivities = recentActivitiesQuery
            .Select(a => new RecentActivityItem
            {
                Id = a.Id,
                Type = a.Type.ToString(),
                DoctorName = a.Doctor?.Name ?? "",
                CreatedAt = a.CreatedAt
            })
            .ToList();

        // Calculate TasksToday and TasksOverdue from Doctor.NextFollowUpAt
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var assignedDoctors = await _context.Doctors
            .Where(d => d.AssignedSalesId == salesId)
            .ToListAsync();
        var tasksToday = assignedDoctors.Count(d => d.NextFollowUpAt.HasValue && d.NextFollowUpAt.Value >= today && d.NextFollowUpAt.Value < tomorrow);
        var tasksOverdue = assignedDoctors.Count(d => d.NextFollowUpAt.HasValue && d.NextFollowUpAt.Value < today);

        // KPI targets from User entity with fallback defaults
        var targetRevenue = sales?.RevenueTarget > 0 ? sales.RevenueTarget : 50000000m;
        var targetDeals = sales?.DealsTarget > 0 ? sales.DealsTarget : 10;

        // MyDealDetails - actual active deals with details
        var myDealDetails = activeDeals
            .Select(d => new MyDealItem
            {
                DealId = d.Id,
                DoctorName = d.Doctor?.Name ?? "",
                HospitalName = d.Doctor?.Hospital?.Name ?? "",
                TotalValue = d.TotalValue,
                Stage = d.Stage.ToString(),
                ExpectedCloseDate = d.ExpectedCloseDate,
                Probability = d.Probability
            })
            .ToList();

        return new SalesDashboardResponse
        {
            MyDeals = activeDeals.Count,
            MyPipelineValue = activeDeals.Sum(d => d.TotalValue),
            MyWeightedForecast = activeDeals.Sum(d => d.TotalValue * d.Probability / 100.0m),
            TasksToday = tasksToday,
            TasksOverdue = tasksOverdue,
            KpiProgress = new KpiProgressItem
            {
                TargetRevenue = targetRevenue,
                CurrentRevenue = myRevenue,
                TargetDeals = targetDeals,
                WonDeals = wonDeals.Count
            },
            RecentActivities = recentActivities,
            MyDealDetails = myDealDetails
        };
    }
}