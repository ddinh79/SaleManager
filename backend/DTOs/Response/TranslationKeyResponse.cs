namespace SalesSystem.DTOs.Response;

public class TranslationKeyListResponse
{
    public List<TranslationKeyResponse> Keys { get; set; } = new();
}

public class TranslationKeyResponse
{
    public string Key { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDeleted { get; set; }
}