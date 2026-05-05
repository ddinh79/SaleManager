using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface ITranslationRepository : IRepository<TranslationKey>
{
    Task<Dictionary<string, string>> GetTranslationsByLocaleAsync(string locale);
    Task<int> GetVersionAsync(string locale);
    Task<Translation?> GetTranslationAsync(string key, string locale);
    Task<bool> ExistsAsync(string key);
    Task<List<TranslationKey>> GetKeysWithMissingTranslationsAsync(string locale);
    Task UpsertTranslationAsync(string key, string locale, string value);
    Task CreateKeyWithTranslationsAsync(TranslationKey translationKey, Dictionary<string, string> initialValues);
    Task SoftDeleteAsync(Guid id);
    Task LogAuditAsync(Guid translationKeyId, string locale, string? oldValue, string newValue, Guid userId);
}