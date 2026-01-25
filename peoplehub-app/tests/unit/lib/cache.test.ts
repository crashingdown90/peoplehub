/**
 * @jest-environment node
 */
/**
 * @jest-environment node
 */
// @ai:cl - Cache module unit tests
import {
  InMemoryCacheStore,
  CacheManager,
  CacheKeys,
  CacheTags,
  CacheTTL,
  getCache,
  clearCacheInstance,
} from "@/lib/cache";

describe("InMemoryCacheStore", () => {
  let store: InMemoryCacheStore;

  beforeEach(() => {
    store = new InMemoryCacheStore(100000); // Long interval for tests
  });

  afterEach(() => {
    store.destroy();
  });

  describe("basic operations", () => {
    it("should set and get value", async () => {
      await store.set("key1", "value1");
      const result = await store.get<string>("key1");
      expect(result).toBe("value1");
    });

    it("should return null for missing key", async () => {
      const result = await store.get<string>("nonexistent");
      expect(result).toBeNull();
    });

    it("should check if key exists", async () => {
      await store.set("key1", "value1");
      expect(await store.has("key1")).toBe(true);
      expect(await store.has("nonexistent")).toBe(false);
    });

    it("should delete key", async () => {
      await store.set("key1", "value1");
      const deleted = await store.delete("key1");
      expect(deleted).toBe(true);
      expect(await store.has("key1")).toBe(false);
    });

    it("should clear all keys", async () => {
      await store.set("key1", "value1");
      await store.set("key2", "value2");
      await store.clear();
      expect(await store.has("key1")).toBe(false);
      expect(await store.has("key2")).toBe(false);
    });

    it("should list keys with pattern", async () => {
      await store.set("user:1", "a");
      await store.set("user:2", "b");
      await store.set("post:1", "c");

      const userKeys = await store.keys("user:*");
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain("user:1");
      expect(userKeys).toContain("user:2");

      const allKeys = await store.keys();
      expect(allKeys).toHaveLength(3);
    });
  });

  describe("TTL (expiration)", () => {
    it("should expire key after TTL", async () => {
      await store.set("expiring", "value", { ttl: 50 });

      expect(await store.get<string>("expiring")).toBe("value");

      await new Promise((r) => setTimeout(r, 100));

      expect(await store.get<string>("expiring")).toBeNull();
    });

    it("should not expire key without TTL", async () => {
      await store.set("persistent", "value");

      await new Promise((r) => setTimeout(r, 50));

      expect(await store.get<string>("persistent")).toBe("value");
    });

    it("should return false for has() on expired key", async () => {
      await store.set("expiring", "value", { ttl: 50 });

      await new Promise((r) => setTimeout(r, 100));

      expect(await store.has("expiring")).toBe(false);
    });
  });

  describe("tag-based invalidation", () => {
    it("should associate keys with tags", async () => {
      await store.set("user:1", { name: "John" }, { tags: ["users", "tenant-1"] });
      await store.set("user:2", { name: "Jane" }, { tags: ["users", "tenant-1"] });
      await store.set("post:1", { title: "Hello" }, { tags: ["posts", "tenant-1"] });

      const deleted = await store.invalidateByTag("users");
      expect(deleted).toBe(2);

      expect(await store.has("user:1")).toBe(false);
      expect(await store.has("user:2")).toBe(false);
      expect(await store.has("post:1")).toBe(true);
    });

    it("should invalidate by multiple tags", async () => {
      await store.set("user:1", { name: "John" }, { tags: ["users"] });
      await store.set("post:1", { title: "Hello" }, { tags: ["posts"] });

      const deleted = await store.invalidateByTags(["users", "posts"]);
      expect(deleted).toBe(2);

      expect(await store.has("user:1")).toBe(false);
      expect(await store.has("post:1")).toBe(false);
    });

    it("should update tags when key is overwritten", async () => {
      await store.set("key1", "v1", { tags: ["tag-old"] });
      await store.set("key1", "v2", { tags: ["tag-new"] });

      // Old tag should no longer affect the key
      await store.invalidateByTag("tag-old");
      expect(await store.has("key1")).toBe(true);

      // New tag should work
      await store.invalidateByTag("tag-new");
      expect(await store.has("key1")).toBe(false);
    });
  });

  describe("stats", () => {
    it("should track hits and misses", async () => {
      await store.set("key1", "value1");

      await store.get<string>("key1"); // hit
      await store.get<string>("key1"); // hit
      await store.get<string>("nonexistent"); // miss
      await store.get<string>("nonexistent"); // miss

      const stats = store.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
    });

    it("should track cache size", async () => {
      await store.set("key1", "value1");
      await store.set("key2", "value2");

      expect(store.getStats().size).toBe(2);

      await store.delete("key1");
      expect(store.getStats().size).toBe(1);
    });
  });

  describe("complex values", () => {
    it("should cache objects", async () => {
      const obj = { id: 1, name: "Test", nested: { value: 123 } };
      await store.set("object", obj);

      const result = await store.get<typeof obj>("object");
      expect(result).toEqual(obj);
    });

    it("should cache arrays", async () => {
      const arr = [1, 2, 3, { key: "value" }];
      await store.set("array", arr);

      const result = await store.get<typeof arr>("array");
      expect(result).toEqual(arr);
    });
  });
});

describe("CacheManager", () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(new InMemoryCacheStore(100000), {
      defaultTtl: 5 * 60 * 1000,
      prefix: "test:",
    });
  });

  afterEach(async () => {
    await cache.clear();
  });

  describe("basic operations", () => {
    it("should get and set with prefix", async () => {
      await cache.set("key1", "value1");

      const result = await cache.get<string>("key1");
      expect(result).toBe("value1");
    });

    it("should check existence", async () => {
      await cache.set("key1", "value1");
      expect(await cache.has("key1")).toBe(true);
      expect(await cache.has("nonexistent")).toBe(false);
    });

    it("should delete key", async () => {
      await cache.set("key1", "value1");
      await cache.delete("key1");
      expect(await cache.has("key1")).toBe(false);
    });
  });

  describe("getOrSet", () => {
    it("should return cached value if exists", async () => {
      await cache.set("key1", "cached");

      const fetcher = jest.fn().mockResolvedValue("fetched");
      const result = await cache.getOrSet("key1", fetcher);

      expect(result).toBe("cached");
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should fetch and cache if not exists", async () => {
      const fetcher = jest.fn().mockResolvedValue("fetched");
      const result = await cache.getOrSet("key1", fetcher);

      expect(result).toBe("fetched");
      expect(fetcher).toHaveBeenCalled();

      // Second call should use cache
      fetcher.mockClear();
      const result2 = await cache.getOrSet("key1", fetcher);
      expect(result2).toBe("fetched");
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should pass options to set", async () => {
      const fetcher = jest.fn().mockResolvedValue("value");

      await cache.getOrSet("key1", fetcher, {
        ttl: 1000,
        tags: ["tag1"],
      });

      // Value should be cached
      expect(await cache.has("key1")).toBe(true);

      // Tag invalidation should work
      await cache.invalidateByTag("tag1");
      expect(await cache.has("key1")).toBe(false);
    });
  });

  describe("tag invalidation", () => {
    it("should invalidate by single tag", async () => {
      await cache.set("user:1", "u1", { tags: ["users"] });
      await cache.set("user:2", "u2", { tags: ["users"] });
      await cache.set("post:1", "p1", { tags: ["posts"] });

      await cache.invalidateByTag("users");

      expect(await cache.has("user:1")).toBe(false);
      expect(await cache.has("user:2")).toBe(false);
      expect(await cache.has("post:1")).toBe(true);
    });

    it("should invalidate by multiple tags", async () => {
      await cache.set("key1", "v1", { tags: ["tag1"] });
      await cache.set("key2", "v2", { tags: ["tag2"] });

      await cache.invalidateByTags(["tag1", "tag2"]);

      expect(await cache.has("key1")).toBe(false);
      expect(await cache.has("key2")).toBe(false);
    });
  });

  describe("stats", () => {
    it("should expose stats from store", async () => {
      await cache.set("key1", "value");
      await cache.get<string>("key1");
      await cache.get<string>("nonexistent");

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);
    });
  });
});

describe("CacheKeys", () => {
  it("should generate employee cache key", () => {
    const key = CacheKeys.employee("tenant-1", "emp-123");
    expect(key).toBe("employee:tenant-1:emp-123");
  });

  it("should generate leave balance cache key", () => {
    const key = CacheKeys.leaveBalance("tenant-1", "emp-123", 2026);
    expect(key).toBe("leave:balance:tenant-1:emp-123:2026");
  });

  it("should generate notification unread cache key", () => {
    const key = CacheKeys.notificationUnread("tenant-1", "user-123");
    expect(key).toBe("notifications:unread:tenant-1:user-123");
  });

  it("should generate dashboard stats cache key", () => {
    const key = CacheKeys.dashboardStats("tenant-1", "ADMIN");
    expect(key).toBe("dashboard:stats:tenant-1:ADMIN");
  });
});

describe("CacheTags", () => {
  it("should generate employee tag", () => {
    const tag = CacheTags.employee("tenant-1");
    expect(tag).toBe("tag:employee:tenant-1");
  });

  it("should generate notification tag", () => {
    const tag = CacheTags.notification("user-123");
    expect(tag).toBe("tag:notification:user-123");
  });
});

describe("CacheTTL", () => {
  it("should have correct values", () => {
    expect(CacheTTL.SHORT).toBe(60 * 1000);
    expect(CacheTTL.MEDIUM).toBe(5 * 60 * 1000);
    expect(CacheTTL.LONG).toBe(15 * 60 * 1000);
    expect(CacheTTL.HOUR).toBe(60 * 60 * 1000);
    expect(CacheTTL.DAY).toBe(24 * 60 * 60 * 1000);
  });
});

describe("getCache singleton", () => {
  afterEach(() => {
    clearCacheInstance();
  });

  it("should return same instance", () => {
    const cache1 = getCache();
    const cache2 = getCache();
    expect(cache1).toBe(cache2);
  });

  it("should create new instance after clear", () => {
    const cache1 = getCache();
    clearCacheInstance();
    const cache2 = getCache();
    expect(cache1).not.toBe(cache2);
  });
});
