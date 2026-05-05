using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;

namespace SalesSystem.Services;

public interface ITranslationService
{
    Task<I18nResponse?> GetTranslationsAsync(string locale, string? ns = null);
    Task<TranslationKeyListResponse> GetKeysAsync();
    Task<List<TranslationKeyResponse>> GetMissingKeysAsync(string locale);
    Task<TranslationUpdateResponse?> UpdateTranslationAsync(string key, string locale, string value, int? expectedVersion, Guid userId);
    Task<TranslationKeyResponse> CreateKeyAsync(string key, string category, string? description, Dictionary<string, string>? initialValues, Guid userId);
    Task<BulkUpdateResponse> BulkUpdateAsync(string locale, List<BulkTranslationChange> changes, Guid userId);
    Task SoftDeleteKeyAsync(string key);
    Task LogMissingKeyAsync(string key, string locale);
}