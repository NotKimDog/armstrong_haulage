// API Response Caching & Rate Limiting Utilities
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple in-memory cache (for development, use Redis in production)
const cache = new Map<string, CacheEntry<any>>();
const rateLimits = new Map<string, RateLimitEntry>();

/**
 * Set cache with TTL (Time To Live)
 */
export function setCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Get cache if not expired
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Clear specific cache key
 */
export function clearCache(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Check rate limit for a key (identifier)
 * Returns true if within limit, false if exceeded
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000
): boolean {
  const now = Date.now();
  const entry = rateLimits.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get rate limit info for debugging
 */
export function getRateLimitInfo(identifier: string) {
  const entry = rateLimits.get(identifier);
  if (!entry) return null;

  return {
    count: entry.count,
    resetTime: entry.resetTime,
    remainingMs: Math.max(0, entry.resetTime - Date.now()),
  };
}

/**
 * Middleware for rate limiting responses
 */
export function getRateLimitHeaders(identifier: string, maxRequests: number = 100) {
  const info = getRateLimitInfo(identifier);
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': info ? Math.max(0, maxRequests - info.count).toString() : maxRequests.toString(),
    'X-RateLimit-Reset': info ? new Date(info.resetTime).toISOString() : new Date(Date.now() + 60000).toISOString(),
  };
}

/**
 * Decorator pattern for caching API responses
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  return new Promise(async (resolve) => {
    const cached = getCache<T>(key);
    if (cached) {
      resolve(cached);
      return;
    }

    try {
      const data = await fetcher();
      setCache(key, data, ttlMs);
      resolve(data);
    } catch (error) {
      throw error;
    }
  });
}

// Cleanup expired entries periodically (every 5 minutes)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
