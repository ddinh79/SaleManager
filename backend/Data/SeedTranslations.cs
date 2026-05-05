using SalesSystem.Data;
using SalesSystem.Entities;

namespace SalesSystem.Data;

public static class SeedTranslations
{
    public static void Seed(AppDbContext context)
    {
        if (context.TranslationKeys.Any()) return; // Already seeded

        var commonKeys = new[]
        {
            ("common.save", "common", "Save button"),
            ("common.cancel", "common", "Cancel button"),
            ("common.delete", "common", "Delete button"),
            ("common.edit", "common", "Edit button"),
            ("common.search", "common", "Search placeholder"),
            ("common.loading", "common", "Loading indicator"),
            ("common.error", "common", "Error message"),
            ("common.success", "common", "Success message"),
            ("common.confirm", "common", "Confirm dialog"),
            ("common.yes", "common", "Yes button"),
            ("common.no", "common", "No button"),
            ("doctors.title", "doctors", "Doctors page title"),
            ("doctors.add", "doctors", "Add doctor button"),
            ("doctors.edit", "doctors", "Edit doctor"),
            ("doctors.delete", "doctors", "Delete doctor"),
            ("doctors.name", "doctors", "Doctor name"),
            ("doctors.specialty", "doctors", "Specialty field"),
            ("doctors.phone", "doctors", "Phone field"),
            ("hospitals.title", "hospitals", "Hospitals page title"),
            ("hospitals.add", "hospitals", "Add hospital button"),
            ("hospitals.name", "hospitals", "Hospital name"),
            ("hospitals.address", "hospitals", "Address field"),
            ("deals.title", "deals", "Deals pipeline title"),
            ("deals.new", "deals", "New deal"),
            ("deals.in_progress", "deals", "In progress"),
            ("deals.negotiation", "deals", "Negotiation stage"),
            ("deals.won", "deals", "Won deals"),
            ("deals.lost", "deals", "Lost deals"),
            ("tasks.title", "tasks", "Tasks page title"),
            ("tasks.today", "tasks", "Today's tasks"),
            ("tasks.upcoming", "tasks", "Upcoming tasks"),
            ("nav.dashboard", "nav", "Dashboard nav item"),
            ("nav.doctors", "nav", "Doctors nav item"),
            ("nav.hospitals", "nav", "Hospitals nav item"),
            ("nav.deals", "nav", "Deals nav item"),
            ("nav.tasks", "nav", "Tasks nav item"),
            ("nav.i18n", "nav", "i18n Admin nav item"),
        };

        foreach (var (key, category, description) in commonKeys)
        {
            var translationKey = new TranslationKey
            {
                Key = key,
                Category = category,
                Description = description,
                CreatedAt = DateTime.UtcNow
            };
            context.TranslationKeys.Add(translationKey);
            context.SaveChanges();

            // English as source of truth (value = last segment of key formatted)
            var englishValue = FormatAsEnglish(key.Split('.').Last());
            context.Translations.Add(new Translation
            {
                TranslationKeyId = translationKey.Id,
                Locale = "en",
                Value = englishValue,
                UpdatedAt = DateTime.UtcNow
            });
        }

        // Initialize version records
        context.I18nVersions.Add(new I18nVersion { Locale = "en", Version = 1, UpdatedAt = DateTime.UtcNow });
        context.I18nVersions.Add(new I18nVersion { Locale = "vi", Version = 1, UpdatedAt = DateTime.UtcNow });

        context.SaveChanges();
    }

    private static string FormatAsEnglish(string key)
    {
        // Convert snake_case or kebab-case to Title Case
        return key.Replace("_", " ").Replace("-", " ")
            .Split(' ')
            .Select(word => char.ToUpper(word[0]) + word.Substring(1).ToLower())
            .Aggregate((a, b) => a + " ");
    }
}