using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Hubs;
using SalesSystem.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace SalesSystem.Services;

public class DealService : IDealService
{
    private readonly AppDbContext _context;
    private readonly IDealRepository _dealRepo;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IUserRepository _userRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly IActivityRepository _activityRepo;
    private readonly IHubContext<DealHub>? _dealHubContext;

    // In-memory metrics cache (TTL 5 seconds)
    private static readonly Dictionary<string, (Dictionary<string, StageMetric> metrics, DateTime timestamp)> _metricsCache = new();
    private static readonly TimeSpan METRICS_TTL = TimeSpan.FromSeconds(5);

    public DealService(
        AppDbContext context,
        IDealRepository dealRepo,
        IDoctorRepository doctorRepo,
        IUserRepository userRepo,
        IOrderRepository orderRepo,
        IActivityRepository activityRepo,
        IHubContext<DealHub>? dealHubContext = null)
    {
        _context = context;
        _dealRepo = dealRepo;
        _doctorRepo = doctorRepo;
        _userRepo = userRepo;
        _orderRepo = orderRepo;
        _activityRepo = activityRepo;
        _dealHubContext = dealHubContext;
    }

    public async Task<DealResponse> CreateDealAsync(CreateDealRequest request, Guid salesId)
    {
        var doctor = await _doctorRepo.GetByIdAsync(request.DoctorId);
        if (doctor == null) throw new InvalidOperationException("Doctor not found");

        // Get max position in NEW stage
        var maxPosition = await _dealRepo.GetMaxPositionInStageAsync(DealStage.NEW);

        var deal = new Deal
        {
            DoctorId = request.DoctorId,
            SalesId = salesId,
            Product = request.Product,
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            ExpectedCloseDate = request.ExpectedCloseDate ?? DateTime.UtcNow.AddDays(30),
            Notes = request.Notes,
            Stage = DealStage.NEW,
            Probability = 10,
            Position = maxPosition + 1000,
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dealRepo.AddAsync(deal);

        // Broadcast to relevant groups
        if (_dealHubContext != null)
        {
            await _dealHubContext.Clients.Group("Pipeline_Admin").SendAsync("DealCreated", new
            {
                type = "deal_created",
                dealId = deal.Id.ToString(),
                salesId = deal.SalesId.ToString()
            });
            await _dealHubContext.Clients.Group($"Pipeline_User_{deal.SalesId}").SendAsync("DealCreated", new
            {
                type = "deal_created",
                dealId = deal.Id.ToString(),
                salesId = deal.SalesId.ToString()
            });
        }

        return MapToDealResponse(deal, doctor.Name);
    }

    public async Task<DealResponse?> GetDealByIdAsync(Guid id)
    {
        var deal = await _dealRepo.GetByIdWithDetailsAsync(id);
        if (deal == null) return null;
        return MapToDealResponse(deal, deal.Doctor?.Name ?? "");
    }

    public async Task<DealResponse?> UpdateDealAsync(Guid id, UpdateDealRequest request, Guid salesId, string userRole)
    {
        var deal = await _dealRepo.GetByIdWithDetailsAsync(id);
        if (deal == null) return null;

        // Locked check
        if (deal.Stage == DealStage.WON || deal.Stage == DealStage.LOST)
            throw new InvalidOperationException("Cannot edit locked deal");

        // Ownership check
        if (userRole != "Admin" && deal.SalesId != salesId)
            throw new InvalidOperationException("Not authorized");

        if (request.Product.HasValue) deal.Product = request.Product.Value;
        if (request.Quantity.HasValue) deal.Quantity = request.Quantity.Value;
        if (request.UnitPrice.HasValue) deal.UnitPrice = request.UnitPrice.Value;
        if (request.ExpectedCloseDate.HasValue) deal.ExpectedCloseDate = request.ExpectedCloseDate.Value;
        if (request.Notes != null) deal.Notes = request.Notes;

        deal.UpdatedAt = DateTime.UtcNow;
        await _dealRepo.UpdateAsync(deal);

        return MapToDealResponse(deal, deal.Doctor?.Name ?? "");
    }

    public async Task<bool> DeleteDealAsync(Guid id, Guid salesId, string userRole)
    {
        var deal = await _dealRepo.GetByIdAsync(id);
        if (deal == null) return false;

        if (deal.Stage == DealStage.WON || deal.Stage == DealStage.LOST)
            throw new InvalidOperationException("Cannot delete locked deal");

        if (userRole != "Admin" && deal.SalesId != salesId)
            throw new InvalidOperationException("Not authorized");

        // Broadcast before delete
        if (_dealHubContext != null)
        {
            await BroadcastDealDeleted(deal);
        }

        await _dealRepo.DeleteAsync(id);
        return true;
    }

    public async Task<PipelineResponse> GetPipelineAsync(Guid? managerId, string userRole, Guid currentUserId, int limit = 50)
    {
        IEnumerable<Deal> deals;
        IEnumerable<Deal> allDealsForMetrics; // All deals for accurate metrics

        if (userRole == "Admin")
        {
            deals = await _dealRepo.GetAllWithDetailsAsync(limit, 0);
            allDealsForMetrics = await _dealRepo.GetAllForMetricsAsync();
        }
        else if (userRole == "SalesManager")
        {
            var teamSales = await _userRepo.FindAsync(u => u.ManagerId == currentUserId);
            var salesIds = teamSales.Select(u => u.Id).ToList();
            deals = await _dealRepo.GetByTeamSalesIdsAsync(salesIds, limit, 0);
            allDealsForMetrics = await _dealRepo.GetAllByTeamSalesIdsForMetricsAsync(salesIds);
        }
        else
        {
            deals = await _dealRepo.GetBySalesIdAsync(currentUserId, limit, 0);
            allDealsForMetrics = await _dealRepo.GetAllBySalesIdForMetricsAsync(currentUserId);
        }

        var grouped = deals.GroupBy(d => d.Stage.ToString())
            .ToDictionary(g => g.Key, g => g.Select(d => MapToDealResponse(d, d.Doctor?.Name ?? "")).ToList());

        // Ensure all stages exist
        var allStages = new[] { "NEW", "IN_PROGRESS", "NEGOTIATION", "WON", "LOST" };
        foreach (var stage in allStages)
        {
            if (!grouped.ContainsKey(stage)) grouped[stage] = new List<DealResponse>();
        }

        // Calculate metrics from ALL deals (not limited) for accuracy
        var metrics = CalculateCachedMetrics(allDealsForMetrics, allStages.ToList());

        return new PipelineResponse { Stages = grouped, Metrics = metrics };
    }

    public async Task<ForecastResponse> GetForecastAsync()
    {
        var deals = await _dealRepo.GetAllWithDetailsAsync();
        var activeDeals = deals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST).ToList();

        var stageItems = activeDeals.GroupBy(d => d.Stage)
            .Select(g => new ForecastStageItem
            {
                Stage = g.Key.ToString(),
                Count = g.Count(),
                TotalValue = g.Sum(d => d.TotalValue),
                WeightedValue = g.Sum(d => d.TotalValue * d.Probability / 100)
            }).ToList();

        return new ForecastResponse
        {
            Stages = stageItems,
            TotalPipelineValue = activeDeals.Sum(d => d.TotalValue),
            WeightedForecast = activeDeals.Sum(d => d.TotalValue * d.Probability / 100)
        };
    }

    /// <summary>
    /// Update deal stage with full business logic:
    /// - Concurrency check
    /// - Stage transition validation
    /// - WON requires activity (3 days)
    /// - LOST requires reason
    /// - Activity logging
    /// - Position calculation
    /// - SignalR broadcast
    /// </summary>
    public async Task<DealResponse?> UpdateStageAsync(Guid id, UpdateStageRequest request, Guid salesId, string userRole)
    {
        var deal = await _dealRepo.GetByIdWithDetailsAsync(id);
        if (deal == null) return null;

        // Ownership check
        if (userRole != "Admin" && deal.SalesId != salesId)
            throw new InvalidOperationException("Not authorized");

        // Concurrency check
        if (request.ExpectedVersion > 0 && deal.Version != request.ExpectedVersion)
            throw new InvalidOperationException("CONCURRENCY_CONFLICT:Deal was modified by another user. Please refresh and try again.");

        var newStage = request.Stage;
        var oldStage = deal.Stage;

        // Locked check
        if (oldStage == DealStage.WON || oldStage == DealStage.LOST)
            throw new InvalidOperationException("Cannot change stage of locked deal");

        // Linear progression validation
        if (!IsValidTransition(oldStage, newStage))
            throw new InvalidOperationException($"Invalid stage transition from {oldStage} to {newStage}");

        // WON rule check
        if (newStage == DealStage.WON)
        {
            var hasRecentActivity = await HasRecentActivityAsync(deal.DoctorId, 3);
            if (!hasRecentActivity)
                throw new InvalidOperationException("Cannot move to WON without activity within last 3 days (CALL or MEETING only)");

            // WON also requires positive value
            if (deal.TotalValue <= 0)
                throw new InvalidOperationException("Cannot move to WON with zero or negative total value");
        }

        // LOST reason required
        if (newStage == DealStage.LOST && !request.LostReason.HasValue)
            throw new InvalidOperationException("Lost reason is required when marking a deal as lost");

        var oldStageStr = oldStage.ToString();
        deal.Stage = newStage;
        deal.LostReason = request.LostReason?.ToString();
        deal.LostNotes = request.LostNotes;
        deal.Version++;

        // Auto-create order when deal becomes WON
        if (newStage == DealStage.WON && oldStage != DealStage.WON)
        {
            var order = new Order
            {
                DealId = deal.Id,
                DoctorId = deal.DoctorId,
                Product = deal.Product,
                Quantity = deal.Quantity,
                Price = deal.UnitPrice,
                TotalValue = deal.TotalValue,
                Status = OrderStatus.PENDING_APPROVAL,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _orderRepo.AddAsync(order);
        }

        // Update probability based on stage
        deal.Probability = newStage switch
        {
            DealStage.NEW => 10,
            DealStage.IN_PROGRESS => 40,
            DealStage.NEGOTIATION => 70,
            DealStage.WON => 100,
            DealStage.LOST => 0,
            _ => deal.Probability
        };

        // Set position for new column
        if (oldStage != newStage)
        {
            var maxPos = await _dealRepo.GetMaxPositionInStageAsync(newStage);
            deal.Position = maxPos + 1000;
        }

        deal.UpdatedAt = DateTime.UtcNow;
        await _dealRepo.UpdateAsync(deal);

        // Clear metrics cache
        ClearMetricsCache();

        // Create activity log for stage change
        await CreateStageChangeActivityAsync(deal, oldStageStr, newStage.ToString());

        // Broadcast via SignalR
        if (_dealHubContext != null)
        {
            await BroadcastDealMoved(deal, oldStageStr, newStage.ToString());
        }

        return MapToDealResponse(deal, deal.Doctor?.Name ?? "");
    }

    /// <summary>
    /// Rebalance positions within a stage column.
    /// Uses DB transaction for safety.
    /// </summary>
    public async Task RebalanceStageAsync(DealStage stage)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var deals = await _dealRepo.GetByStageAsync(stage, 1000, 0);
            var position = 1000;
            foreach (var deal in deals.OrderBy(d => d.Position))
            {
                deal.Position = position;
                deal.UpdatedAt = DateTime.UtcNow;
                await _dealRepo.UpdateAsync(deal);
                position += 1000;
            }
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private bool IsValidTransition(DealStage from, DealStage to)
    {
        if (from == DealStage.LOST) return true; // LOST can go back to any stage

        var order = new[] { DealStage.NEW, DealStage.IN_PROGRESS, DealStage.NEGOTIATION };
        var fromIdx = Array.IndexOf(order, from);
        var toIdx = Array.IndexOf(order, to);

        // Can go forward one step, or to LOST
        if (to == DealStage.LOST) return true;
        return toIdx == fromIdx + 1;
    }

    private async Task<bool> HasRecentActivityAsync(Guid doctorId, int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        return await _context.Activities
            .Where(a => a.DoctorId == doctorId
                && a.CreatedAt >= cutoff
                && (a.Type == ActivityType.CALL || a.Type == ActivityType.MEETING))
            .AnyAsync();
    }

    private async Task CreateStageChangeActivityAsync(Deal deal, string fromStage, string toStage)
    {
        var activity = new Activity
        {
            SalesId = deal.SalesId,
            DoctorId = deal.DoctorId,
            Type = ActivityType.DEAL_STAGE_CHANGED,
            Content = $"Deal moved from {fromStage} to {toStage}",
            Result = ActivityResult.FollowUp,
            CreatedAt = DateTime.UtcNow
        };
        await _activityRepo.AddAsync(activity);
    }

    private Dictionary<string, StageMetric> CalculateCachedMetrics(IEnumerable<Deal> deals, List<string> activeStages)
    {
        var cacheKey = string.Join(",", activeStages.OrderBy(s => s));
        var now = DateTime.UtcNow;

        // Check cache
        if (_metricsCache.TryGetValue(cacheKey, out var cached) && now - cached.timestamp < METRICS_TTL)
        {
            return cached.metrics;
        }

        // Calculate fresh
        var metrics = deals.GroupBy(d => d.Stage.ToString())
            .ToDictionary(
                g => g.Key,
                g => new StageMetric
                {
                    Count = g.Count(),
                    TotalValue = g.Sum(d => d.TotalValue)
                });

        // Ensure all stages have entry
        foreach (var stage in activeStages)
        {
            if (!metrics.ContainsKey(stage))
                metrics[stage] = new StageMetric { Count = 0, TotalValue = 0 };
        }

        // Cache
        _metricsCache[cacheKey] = (metrics, now);

        return metrics;
    }

    private void ClearMetricsCache()
    {
        _metricsCache.Clear();
    }

    private async Task BroadcastDealMoved(Deal deal, string fromStage, string toStage)
    {
        if (_dealHubContext == null) return;

        var message = new
        {
            type = "deal_moved",
            dealId = deal.Id.ToString(),
            fromStage,
            toStage,
            salesId = deal.SalesId.ToString(),
            version = deal.Version
        };

        // Send to admin group
        await _dealHubContext.Clients.Group("Pipeline_Admin").SendAsync("DealMoved", message);

        // Send to sales member's personal group
        await _dealHubContext.Clients.Group($"Pipeline_User_{deal.SalesId}").SendAsync("DealMoved", message);
    }

    private async Task BroadcastDealDeleted(Deal deal)
    {
        if (_dealHubContext == null) return;

        var message = new
        {
            type = "deal_deleted",
            dealId = deal.Id.ToString(),
            salesId = deal.SalesId.ToString()
        };

        await _dealHubContext.Clients.Group("Pipeline_Admin").SendAsync("DealDeleted", message);
        await _dealHubContext.Clients.Group($"Pipeline_User_{deal.SalesId}").SendAsync("DealDeleted", message);
    }

    private DealResponse MapToDealResponse(Deal deal, string doctorName)
    {
        return new DealResponse
        {
            Id = deal.Id,
            DoctorId = deal.DoctorId,
            DoctorName = doctorName,
            SalesId = deal.SalesId,
            SalesName = deal.Sales?.FullName ?? "",
            Product = deal.Product.ToString(),
            Quantity = deal.Quantity,
            UnitPrice = deal.UnitPrice,
            TotalValue = deal.TotalValue,
            Stage = deal.Stage.ToString(),
            Probability = deal.Probability,
            ExpectedCloseDate = deal.ExpectedCloseDate,
            Notes = deal.Notes,
            Position = deal.Position,
            Version = deal.Version,
            LostReason = deal.LostReason,
            LostNotes = deal.LostNotes,
            CreatedAt = deal.CreatedAt,
            UpdatedAt = deal.UpdatedAt
        };
    }
}