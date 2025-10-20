import { CacheKeyBuilder, getCacheManager } from "./redis";

export class RateLimitError extends Error {
  constructor(message, retryAfter = 60) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Enforces a rate limit using Redis as a backend.
 *
 * @param {object} params
 * @param {string} params.identifier Unique identifier for the caller (e.g. IP address or wallet).
 * @param {string} params.action Logical action name used to build a cache key.
 * @param {number} params.limit Maximum number of requests allowed in the window.
 * @param {number} params.windowSeconds Sliding window size in seconds.
 */
export async function enforceRateLimit({
  identifier,
  action,
  limit,
  windowSeconds,
}) {
  const cache = getCacheManager();
  const safeIdentifier = identifier || "unknown";
  const key = CacheKeyBuilder.rateLimit(safeIdentifier, action);

  const currentCount = await cache.increment(key, 1, windowSeconds);

  // If Redis is unavailable increment returns 0, fail closed to stay on the safe side
  if (!currentCount) {
    throw new RateLimitError("Unable to verify request quota", windowSeconds);
  }

  if (currentCount > limit) {
    const ttl = await cache.getTTL(key);
    throw new RateLimitError("Too many requests", ttl > 0 ? ttl : windowSeconds);
  }

  return {
    count: currentCount,
    remaining: Math.max(limit - currentCount, 0),
    resetIn: await cache.getTTL(key),
  };
}