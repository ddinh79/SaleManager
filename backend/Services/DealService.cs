using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class DealService : IDealService
{
    private readonly AppDbContext _context;
    private readonly IDealRepository _dealRepo;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IUserRepository _userRepo;
    private readonly IOrderRepository _orderRepo;

    public DealService(AppDbContext context, IDealRepository dealRepo, IDoctorRepository doctorRepo, IUserRepository userRepo, IOrderRepository orderRepo)
    {
        _context = context;
        _dealRepo = dealRepo;
        _doctorRepo = doctorRepo;
        _userRepo = userRepo;
        _orderRepo = orderRepo;
    }

    public async Task<DealResponse> CreateDealAsync(CreateDealRequest request, Guid salesId)
    {
        var doctor = await _doctorRepo.GetByIdAsync(request.DoctorId);
        if (doctor == null) throw new InvalidOperationException("Doctor not found");

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
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dealRepo.AddAsync(deal);
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

        await _dealRepo.DeleteAsync(id);
        return true;
    }

    public async Task<PipelineResponse> GetPipelineAsync(Guid? managerId, string userRole, Guid currentUserId)
    {
        IEnumerable<Deal> deals;

        if (userRole == "Admin")
        {
            deals = await _dealRepo.GetAllWithDetailsAsync();
        }
        else if (userRole == "SalesManager")
        {
            // Get all sales under this manager
            var teamSales = await _userRepo.FindAsync(u => u.ManagerId == currentUserId);
            var salesIds = teamSales.Select(u => u.Id);
            deals = await _dealRepo.GetByTeamSalesIdsAsync(salesIds);
        }
        else
        {
            // SalesMember - own deals only
            deals = await _dealRepo.GetBySalesIdAsync(currentUserId);
        }

        var grouped = deals.GroupBy(d => d.Stage.ToString())
            .ToDictionary(g => g.Key, g => g.Select(d => MapToDealResponse(d, d.Doctor?.Name ?? "")).ToList());

        // Ensure all stages exist
        var allStages = new[] { "NEW", "IN_PROGRESS", "NEGOTIATION", "WON", "LOST" };
        foreach (var stage in allStages)
        {
            if (!grouped.ContainsKey(stage)) grouped[stage] = new List<DealResponse>();
        }

        return new PipelineResponse { Stages = grouped };
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

    public async Task<DealResponse?> UpdateStageAsync(Guid id, UpdateStageRequest request, Guid salesId, string userRole)
    {
        var deal = await _dealRepo.GetByIdWithDetailsAsync(id);
        if (deal == null) return null;

        // Ownership check
        if (userRole != "Admin" && deal.SalesId != salesId)
            throw new InvalidOperationException("Not authorized");

        var newStage = request.Stage;
        var oldStage = deal.Stage;

        // Locked check - can't transition from WON/LOST
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
        }

        deal.Stage = newStage;

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

        deal.Probability = newStage switch
        {
            DealStage.NEW => 10,
            DealStage.IN_PROGRESS => 40,
            DealStage.NEGOTIATION => 70,
            _ => deal.Probability
        };
        deal.UpdatedAt = DateTime.UtcNow;

        await _dealRepo.UpdateAsync(deal);
        return MapToDealResponse(deal, deal.Doctor?.Name ?? "");
    }

    private bool IsValidTransition(DealStage from, DealStage to)
    {
        var order = new[] { DealStage.NEW, DealStage.IN_PROGRESS, DealStage.NEGOTIATION };
        var fromIdx = Array.IndexOf(order, from);
        var toIdx = Array.IndexOf(order, to);

        if (from == DealStage.LOST) return true; // LOST can go back to any stage

        // Linear: can go forward one step, or to LOST
        if (to == DealStage.LOST) return true;

        // Forward one step
        return toIdx == fromIdx + 1;
    }

    private async Task<bool> HasRecentActivityAsync(Guid doctorId, int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);
        var activities = await _context.Activities
            .Where(a => a.DoctorId == doctorId
                && a.CreatedAt >= cutoff
                && (a.Type == ActivityType.CALL || a.Type == ActivityType.MEETING))
            .AnyAsync();
        return activities;
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
            CreatedAt = deal.CreatedAt,
            UpdatedAt = deal.UpdatedAt
        };
    }
}