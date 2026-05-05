namespace SalesSystem.DTOs.Request;

public class MissingKeyLogRequest
{
    public string Key { get; set; } = string.Empty;
    public string Locale { get; set; } = string.Empty;
    public string? FallbackUsed { get; set; }
}