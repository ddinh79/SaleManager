using System.Text.Json;

namespace SalesSystem.Services;

// NOTE: Redis support is optional. This implementation uses pure in-memory caching.
// To enable Redis, add StackExchange.Redis package and uncomment the Redis code paths.
// The IConnectionMultiplexer parameter allows injection when Redis is available.

public interface ITranslationCache
{
    Task<(int version, string? data)?> GetAsync(string locale);
    Task SetAsync(string locale, int version, string data, TimeSpan? ttl = null);
    Task InvalidateAsync(string locale);
    Task InvalidateAllAsync();
}

public class HybridTranslationCache : ITranslationCache
{
    // Redis support is prepared but optional - falls back to in-memory
    private readonly object _redisLock = new();
    private readonly Dictionary<string, (int version, string data, DateTime timestamp)> _memoryCache = new();
    private readonly object _lock = new();
    private readonly TimeSpan _memoryTtl = TimeSpan.FromMinutes(10);

    // Prepared for Redis when available - using nullable to avoid hard dependency
    private readonly object? _redis;
    private readonly bool _redisAvailable = false;

    public HybridTranslationCache(object? redisConnection = null)
    {
        // Redis connection can be injected when StackExchange.Redis is available
        // For now, use pure in-memory caching
        _redis = redisConnection;
        _redisAvailable = redisConnection != null;
    }

    public async Task<(int version, string? data)?> GetAsync(string locale)
    {
        // For future Redis support:
        // if (_redisAvailable && _redisDb != null) { try Redis first... }

        // Memory cache fallback
        lock (_lock)
        {
            if (_memoryCache.TryGetValue(locale, out var cached) &&
                DateTime.UtcNow - cached.timestamp < _memoryTtl)
            {
                return (cached.version, cached.data);
            }
        }

        return null;
    }

    public async Task SetAsync(string locale, int version, string data, TimeSpan? ttl = null)
    {
        // For future Redis support:
        // if (_redisAvailable) { try Redis first... }

        // Always update memory cache
        lock (_lock)
        {
            _memoryCache[locale] = (version, data, DateTime.UtcNow);
        }
    }

    public async Task InvalidateAsync(string locale)
    {
        // For future Redis support:
        // if (_redisAvailable) { delete from Redis... }

        // Clear memory cache
        lock (_lock)
        {
            _memoryCache.Remove(locale);
        }
    }

    public async Task InvalidateAllAsync()
    {
        // For future Redis support:
        // if (_redisAvailable) { delete all from Redis... }

        lock (_lock)
        {
            _memoryCache.Clear();
        }
    }
}