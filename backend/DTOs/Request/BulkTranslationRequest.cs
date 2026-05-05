namespace SalesSystem.DTOs.Request;

public class BulkTranslationChange
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class BulkTranslationRequest
{
    public string Locale { get; set; } = string.Empty;
    public List<BulkTranslationChange> Changes { get; set; } = new();
}