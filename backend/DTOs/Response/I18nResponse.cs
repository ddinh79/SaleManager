namespace SalesSystem.DTOs.Response;

public class I18nResponse
{
    public int Version { get; set; }
    public string Locale { get; set; } = string.Empty;
    public Dictionary<string, string> Data { get; set; } = new();
}