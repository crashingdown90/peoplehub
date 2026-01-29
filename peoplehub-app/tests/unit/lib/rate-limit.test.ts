/**
 * @jest-environment node
 */
// @ai:cl - Rate limiting unit tests
import {
  RateLimiter,
  RATE_LIMIT_CONFIG,
  getRateLimiter,
  checkRateLimit,
  getClientIP,
  getRateLimitKey,
} from "@/lib/rate-limit";

describe("RateLimiter", () => {
  describe("basic functionality", () => {
    it("should allow requests within limit", async () => {
      const limiter = new RateLimiter({ limit: 5, windowMs: 60000 });

      const result1 = await limiter.check("user-1");
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = await limiter.check("user-1");
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it("should block requests after limit exceeded", async () => {
      const limiter = new RateLimiter({ limit: 2, windowMs: 60000 });

      await limiter.check("user-2");
      await limiter.check("user-2");
      const result = await limiter.check("user-2");

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should track different identifiers separately", async () => {
      const limiter = new RateLimiter({ limit: 2, windowMs: 60000 });

      await limiter.check("user-a");
      await limiter.check("user-a");
      const resultA = await limiter.check("user-a");

      const resultB = await limiter.check("user-b");

      expect(resultA.success).toBe(false);
      expect(resultB.success).toBe(true);
      expect(resultB.remaining).toBe(1);
    });

    it("should use custom key prefix", async () => {
      const limiter = new RateLimiter({
        limit: 5,
        windowMs: 60000,
        keyPrefix: "custom:",
      });

      const result = await limiter.check("test");
      expect(result.success).toBe(true);
    });

    it("should skip rate limiting when skip function returns true", async () => {
      const limiter = new RateLimiter({
        limit: 1,
        windowMs: 60000,
        skip: (identifier) => identifier === "whitelisted",
      });

      // Exhaust limit
      await limiter.check("normal");
      const normalResult = await limiter.check("normal");

      // Whitelisted should always succeed
      const whitelistedResult = await limiter.check("whitelisted");

      expect(normalResult.success).toBe(false);
      expect(whitelistedResult.success).toBe(true);
      expect(whitelistedResult.remaining).toBe(1); // Full limit returned
    });
  });

  describe("getHeaders", () => {
    it("should return rate limit headers", async () => {
      const limiter = new RateLimiter({ limit: 5, windowMs: 60000 });
      const result = await limiter.check("user-headers");

      const headers = limiter.getHeaders(result);

      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("4");
      expect(headers["X-RateLimit-Reset"]).toBeDefined();
    });

    it("should include Retry-After header when blocked", async () => {
      const limiter = new RateLimiter({ limit: 1, windowMs: 60000 });

      await limiter.check("user-blocked");
      const result = await limiter.check("user-blocked");
      const headers = limiter.getHeaders(result);

      expect(headers["Retry-After"]).toBeDefined();
    });
  });
});

describe("RATE_LIMIT_CONFIG", () => {
  it("should have API config", () => {
    expect(RATE_LIMIT_CONFIG.api).toBeDefined();
    expect(RATE_LIMIT_CONFIG.api.limit).toBe(100);
    expect(RATE_LIMIT_CONFIG.api.windowMs).toBe(60000);
  });

  it("should have auth config with stricter limits", () => {
    expect(RATE_LIMIT_CONFIG.auth).toBeDefined();
    expect(RATE_LIMIT_CONFIG.auth.limit).toBe(10);
    expect(RATE_LIMIT_CONFIG.auth.windowMs).toBe(15 * 60 * 1000);
  });

  it("should have sensitive config with strictest limits", () => {
    expect(RATE_LIMIT_CONFIG.sensitive).toBeDefined();
    expect(RATE_LIMIT_CONFIG.sensitive.limit).toBe(5);
    expect(RATE_LIMIT_CONFIG.sensitive.windowMs).toBe(60 * 60 * 1000);
  });
});

describe("getRateLimiter", () => {
  it("should return singleton instance", () => {
    const limiter1 = getRateLimiter("api");
    const limiter2 = getRateLimiter("api");

    expect(limiter1).toBe(limiter2);
  });

  it("should return different instances for different types", () => {
    const apiLimiter = getRateLimiter("api");
    const authLimiter = getRateLimiter("auth");

    expect(apiLimiter).not.toBe(authLimiter);
  });
});

describe("checkRateLimit", () => {
  it("should return null when allowed", async () => {
    const result = await checkRateLimit("api", "check-allowed-" + Date.now());
    expect(result).toBeNull();
  });

  it("should return result when blocked", async () => {
    const identifier = "check-blocked-" + Date.now();

    // Exhaust the auth limit (10 requests)
    for (let i = 0; i < 10; i++) {
      await checkRateLimit("auth", identifier);
    }

    const result = await checkRateLimit("auth", identifier);

    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    expect(result?.retryAfter).toBeGreaterThan(0);
  });
});

describe("getClientIP", () => {
  it("should extract IP from x-forwarded-for", () => {
    const headers = new Headers();
    headers.set("x-forwarded-for", "192.168.1.1, 10.0.0.1");

    const ip = getClientIP(headers);
    expect(ip).toBe("192.168.1.1");
  });

  it("should extract IP from x-real-ip", () => {
    const headers = new Headers();
    headers.set("x-real-ip", "192.168.1.2");

    const ip = getClientIP(headers);
    expect(ip).toBe("192.168.1.2");
  });

  it("should extract IP from cf-connecting-ip", () => {
    const headers = new Headers();
    headers.set("cf-connecting-ip", "192.168.1.3");

    const ip = getClientIP(headers);
    expect(ip).toBe("192.168.1.3");
  });

  it("should return unknown when no IP headers present", () => {
    const headers = new Headers();

    const ip = getClientIP(headers);
    expect(ip).toBe("unknown");
  });

  it("should prioritize x-forwarded-for", () => {
    const headers = new Headers();
    headers.set("x-forwarded-for", "192.168.1.1");
    headers.set("x-real-ip", "192.168.1.2");
    headers.set("cf-connecting-ip", "192.168.1.3");

    const ip = getClientIP(headers);
    expect(ip).toBe("192.168.1.1");
  });
});

describe("getRateLimitKey", () => {
  it("should use userId when available", () => {
    const key = getRateLimitKey("192.168.1.1", "tenant-123", "user-456");
    expect(key).toBe("tenant-123:user-456");
  });

  it("should use tenantId and IP when no userId", () => {
    const key = getRateLimitKey("192.168.1.1", "tenant-123");
    expect(key).toBe("tenant-123:192.168.1.1");
  });

  it("should use IP only when no tenant or user", () => {
    const key = getRateLimitKey("192.168.1.1");
    expect(key).toBe("192.168.1.1");
  });
});
