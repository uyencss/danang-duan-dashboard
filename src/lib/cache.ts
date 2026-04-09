import redis from "./redis";
import { logger } from "./logger";

/**
 * Get a cached value by key. Returns null on miss or if Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with TTL (in seconds).
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Silently fail — cache is best-effort
  }
}

/**
 * Invalidate cache keys. Supports exact keys and wildcard patterns (e.g. "options:*").
 */
export async function cacheInvalidate(...patterns: string[]): Promise<void> {
  if (!redis) return;
  try {
    const keysToDelete: string[] = [];

    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        const matched = await redis.keys(pattern);
        keysToDelete.push(...matched);
      } else {
        keysToDelete.push(pattern);
      }
    }

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      logger.debug({ msg: "Cache invalidated", keys: keysToDelete });
    }
  } catch {
    // Silently fail
  }
}

/**
 * Cache-aside pattern: check cache → miss → fetch from source → store in cache.
 * If Redis is unavailable, always calls the fetcher directly.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  // Cache miss — fetch from source
  const result = await fetcher();

  // Store in cache (non-blocking)
  cacheSet(key, result, ttlSeconds).catch(() => {});

  return result;
}
