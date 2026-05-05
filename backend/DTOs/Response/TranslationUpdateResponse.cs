namespace SalesSystem.DTOs.Response;

public class TranslationUpdateResponse
{
    public string Key { get; set; } = string.Empty;
    public string Locale { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class BulkUpdateResponse
{
    public int Updated { get; set; }
    public int NewVersion { get; set; }
}