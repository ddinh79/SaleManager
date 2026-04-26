using SalesSystem.Entities;

namespace SalesSystem.DTOs;

// ============ Requests ============

public class CreateDealRequest
{
    public Guid DoctorId { get; set; }
    public ProductType Product { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateDealRequest
{
    public ProductType? Product { get; set; }
    public int? Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateStageRequest
{
    public DealStage Stage { get; set; }
}

// ============ Responses ============

public class DealResponse
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalValue { get; set; }
    public string Stage { get; set; } = string.Empty;
    public int Probability { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PipelineResponse
{
    public Dictionary<string, List<DealResponse>> Stages { get; set; } = new();
}

public class ForecastStageItem
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
    public decimal WeightedValue { get; set; }
}

public class ForecastResponse
{
    public List<ForecastStageItem> Stages { get; set; } = new();
    public decimal TotalPipelineValue { get; set; }
    public decimal WeightedForecast { get; set; }
}