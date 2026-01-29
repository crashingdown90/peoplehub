// @ai:cl - Rate limiting utility (Redis-ready)
import Redis from "ioredis";

// ==========================================
// TYPES
// ==========================================

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key prefix */
  keyPrefix?: string;
  /** Skip rate limiting for certain conditions */
  skip?: (identifier: string) => boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
  retryAfter?: number; // Seconds until retry allowed
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ==========================================
// RATE LIMIT STORE INTERFACE
// ==========================================

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
  increment(key: string): Promise<number>;
}

// ==========================================
// IN-MEMORY STORE (Default)
// ==========================================

class InMemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.resetAt) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    this.store.set(key, entry);
    // Note: ttlMs is for Redis compatibility, in-memory store uses entry.resetTime
  }

  async increment(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (entry) {
      entry.count++;
      return entry.count;
    }
    return 1;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// ==========================================
// REDIS STORE (Production)
// ==========================================

/**
 * Redis-based rate limit store for production
 * Supports distributed deployments with multiple instances
 */
class RedisStore implements RateLimitStore {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const entry = JSON.parse(data) as RateLimitEntry;

      // Check if expired
      if (Date.now() > entry.resetAt) {
        await this.redis.del(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(entry), 'PX', ttlMs);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async increment(key: string): Promise<number> {
    try {
      // Use Redis INCR for atomic increment
      const count = await this.redis.incr(`${key}:count`);

      // Update the full entry
      const entry = await this.get(key);
      if (entry) {
        entry.count = count;
        await this.redis.set(key, JSON.stringify(entry), 'PXAT', entry.resetAt);
      }

      return count;
    } catch (error) {
      console.error('Redis increment error:', error);
      return 1;
    }
  }
}

// ==========================================
// RATE LIMITER CLASS
// ==========================================

export class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      limit: config.limit,
      windowMs: config.windowMs,
      keyPrefix: config.keyPrefix || "ratelimit:",
      skip: config.skip || (() => false),
    };
    this.store = store || new InMemoryStore();
  }

  /**
   * Check if the identifier has exceeded the rate limit
   */
  async check(identifier: string): Promise<RateLimitResult> {
    // Check if should skip rate limiting
    if (this.config.skip(identifier)) {
      return {
        success: true,
        limit: this.config.limit,
        remaining: this.config.limit,
        reset: Date.now() + this.config.windowMs,
      };
    }

    const key = `${this.config.keyPrefix}${identifier}`;
    const now = Date.now();
    const resetAt = now + this.config.windowMs;

    // Get existing entry
    let entry = await this.store.get(key);

    if (!entry) {
      // Create new entry
      entry = { count: 1, resetAt };
      await this.store.set(key, entry, this.config.windowMs);

      return {
        success: true,
        limit: this.config.limit,
        remaining: this.config.limit - 1,
        reset: resetAt,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.config.limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return {
        success: false,
        limit: this.config.limit,
        remaining: 0,
        reset: entry.resetAt,
        retryAfter: retryAfter > 0 ? retryAfter : 1,
      };
    }

    // Increment count
    const newCount = await this.store.increment(key);

    return {
      success: true,
      limit: this.config.limit,
      remaining: this.config.limit - newCount,
      reset: entry.resetAt,
    };
  }

  /**
   * Get rate limit headers for response
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(result.reset),
    };

    if (result.retryAfter) {
      headers["Retry-After"] = String(result.retryAfter);
    }

    return headers;
  }
}

// ==========================================
// PRE-CONFIGURED RATE LIMITERS
// ==========================================

/**
 * Rate limit configurations
 */
export const RATE_LIMIT_CONFIG = {
  /** API routes - 100 requests per minute */
  api: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: "rl:api:",
  },

  /** Authentication routes - 10 attempts per 15 minutes */
  auth: {
    limit: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: "rl:auth:",
  },

  /** Sensitive operations - 5 attempts per hour */
  sensitive: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: "rl:sensitive:",
  },

  /** File upload - 10 uploads per minute */
  upload: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: "rl:upload:",
  },

  /** Report generation - 10 reports per 5 minutes */
  report: {
    limit: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: "rl:report:",
  },

  /** Webhook dispatch - 100 requests per minute */
  webhook: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: "rl:webhook:",
  },
} as const;

// Create singleton instances
const rateLimiters = new Map<string, RateLimiter>();

/**
 * Get a rate limiter instance by type
 */
export function getRateLimiter(type: keyof typeof RATE_LIMIT_CONFIG): RateLimiter {
  if (!rateLimiters.has(type)) {
    rateLimiters.set(type, new RateLimiter(RATE_LIMIT_CONFIG[type]));
  }
  return rateLimiters.get(type)!;
}

/**
 * Create rate limit store based on environment
 * Production: Uses Redis if REDIS_URL is configured
 * Development: Uses in-memory store
 * 
 * @example
 * ```typescript
 * // In production with Redis
 * const Redis = require('ioredis');
 * const redis = new Redis(process.env.REDIS_URL);
 * const store = createRateLimitStore(redis);
 * const limiter = new RateLimiter(RATE_LIMIT_CONFIG.api, store);
 * ```
 */
export function createRateLimitStore(redisClient?: Redis): RateLimitStore {
  if (redisClient) {
    return new RedisStore(redisClient);
  }
  if (process.env.REDIS_URL) {
    const client = new Redis(process.env.REDIS_URL);
    return new RedisStore(client);
  }
  return new InMemoryStore();
}

// Export stores for custom implementations
export { InMemoryStore, RedisStore };

// ==========================================
// MIDDLEWARE HELPER
// ==========================================

/**
 * Check rate limit for a request
 * Returns null if allowed, or RateLimitResult if blocked
 */
export async function checkRateLimit(
  type: keyof typeof RATE_LIMIT_CONFIG,
  identifier: string
): Promise<RateLimitResult | null> {
  const limiter = getRateLimiter(type);
  const result = await limiter.check(identifier);

  if (!result.success) {
    return result;
  }

  return null;
}

/**
 * Create rate limit response headers
 */
export function createRateLimitResponse(result: RateLimitResult): {
  status: number;
  headers: Record<string, string>;
  body: {
    success: false;
    error: {
      code: string;
      message: string;
      retryAfter?: number;
    };
  };
} {
  const limiter = getRateLimiter("api");
  return {
    status: 429,
    headers: limiter.getHeaders(result),
    body: {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Terlalu banyak permintaan. Coba lagi dalam ${result.retryAfter} detik.`,
        retryAfter: result.retryAfter,
      },
    },
  };
}

// ==========================================
// IP EXTRACTION HELPER
// ==========================================

/**
 * Extract client IP from request headers
 */
export function getClientIP(headers: Headers): string {
  // Check common proxy headers
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP (client IP)
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return "unknown";
}

/**
 * Generate rate limit key from request
 * Uses IP + tenant ID for better isolation
 */
export function getRateLimitKey(
  ip: string,
  tenantId?: string,
  userId?: string
): string {
  if (userId) {
    return `${tenantId || "global"}:${userId}`;
  }
  if (tenantId) {
    return `${tenantId}:${ip}`;
  }
  return ip;
}
