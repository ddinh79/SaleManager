namespace SalesSystem.DTOs.Request;

public class UpdateTranslationRequest
{
    public string Locale { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int? ExpectedVersion { get; set; }
}