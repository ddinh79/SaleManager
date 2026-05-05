using System.Text.Json.Serialization;

namespace SalesSystem.DTOs.Response;

public class PaginatedResponse<T>
{
    [JsonPropertyName("Data")]
    public List<T> Data { get; set; } = new();

    [JsonPropertyName("TotalCount")]
    public int TotalCount { get; set; }

    [JsonPropertyName("Page")]
    public int Page { get; set; }

    [JsonPropertyName("PageSize")]
    public int PageSize { get; set; }

    [JsonPropertyName("TotalPages")]
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}