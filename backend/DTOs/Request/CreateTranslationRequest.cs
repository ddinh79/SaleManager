namespace SalesSystem.DTOs.Request;

public class CreateTranslationRequest
{
    public string Key { get; set; } = string.Empty;
    public string Category { get; set; } = "common";
    public string? Description { get; set; }
    public Dictionary<string, string>? InitialValues { get; set; }
}