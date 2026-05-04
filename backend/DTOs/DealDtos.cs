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

    /// <summary>
    /// Expected version for optimistic concurrency check.
    /// If provided and doesn't match current version, throws ConcurrencyException.
    /// </summary>
    public int ExpectedVersion { get; set; }

    /// <summary>
    /// Required when moving to LOST stage.
    /// </summary>
    public LostReason? LostReason { get; set; }

    /// <summary>
    /// Optional notes when marking as LOST.
    /// </summary>
    public string? LostNotes { get; set; }
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
    public int Position { get; set; }
    public int Version { get; set; }
    public string? LostReason { get; set; }
    public string? LostNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Per-stage metrics for pipeline columns.
/// </summary>
public class StageMetric
{
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
}

/// <summary>
/// Pipeline response with deals grouped by stage and column metrics.
/// </summary>
public class PipelineResponse
{
    /// <summary>
    /// Deals grouped by stage name.
    /// </summary>
    public Dictionary<string, List<DealResponse>> Stages { get; set; } = new();

    /// <summary>
    /// Aggregated metrics per stage (count, total value).
    /// </summary>
    public Dictionary<string, StageMetric> Metrics { get; set; } = new();
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