// @ai:cl - Caching layer with Redis-ready interface

// ==========================================
// TYPES
// ==========================================

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
  /** Tags for cache invalidation */
  tags?: string[];
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  tags: string[];
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

// ==========================================
// CACHE STORE INTERFACE
// ==========================================

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;

  // Tag-based operations
  invalidateByTag(tag: string): Promise<number>;
  invalidateByTags(tags: string[]): Promise<number>;

  // Stats
  getStats(): CacheStats;
}

// ==========================================
// IN-MEMORY CACHE STORE
// ==========================================

export class InMemoryCacheStore implements CacheStore {
  private store = new Map<string, CacheEntry<unknown>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl;
    const tags = options?.tags || [];

    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttl ? Date.now() + ttl : null,
      tags,
      createdAt: Date.now(),
    };

    // Remove from old tags if key exists
    const existingEntry = this.store.get(key);
    if (existingEntry) {
      for (const tag of existingEntry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }

    this.store.set(key, entry);
    this.stats.size = this.store.size;

    // Index by tags
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (entry) {
      // Remove from tag index
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }

    const deleted = this.store.delete(key);
    this.stats.size = this.store.size;
    return deleted;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.tagIndex.clear();
    this.stats.size = 0;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());

    if (!pattern) return allKeys;

    // Simple wildcard matching (supports * at start, end, or both)
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    );
    return allKeys.filter((key) => regex.test(key));
  }

  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys || keys.size === 0) return 0;

    let count = 0;
    for (const key of keys) {
      if (await this.delete(key)) count++;
    }

    this.tagIndex.delete(tag);
    return count;
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let count = 0;
    for (const tag of tags) {
      count += await this.invalidateByTag(tag);
    }
    return count;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
    this.tagIndex.clear();
  }
}

// ==========================================
// CACHE MANAGER
// ==========================================

export class CacheManager {
  private store: CacheStore;
  private defaultTtl: number;
  private prefix: string;

  constructor(
    store?: CacheStore,
    options?: { defaultTtl?: number; prefix?: string }
  ) {
    this.store = store || new InMemoryCacheStore();
    this.defaultTtl = options?.defaultTtl || 5 * 60 * 1000; // 5 minutes
    this.prefix = options?.prefix || "cache:";
  }

  private buildKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    return this.store.get<T>(this.buildKey(key));
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    return this.store.set(this.buildKey(key), value, {
      ttl: options?.ttl || this.defaultTtl,
      tags: options?.tags,
    });
  }

  /**
   * Get or set pattern - returns cached value or fetches and caches
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<boolean> {
    return this.store.delete(this.buildKey(key));
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.store.has(this.buildKey(key));
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    return this.store.clear();
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    return this.store.invalidateByTag(tag);
  }

  /**
   * Invalidate cache by multiple tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    return this.store.invalidateByTags(tags);
  }

  /**
   * Get cache stats
   */
  getStats(): CacheStats {
    return this.store.getStats();
  }

  /**
   * Get underlying store (for testing or advanced use)
   */
  getStore(): CacheStore {
    return this.store;
  }
}

// ==========================================
// CACHE KEY BUILDERS
// ==========================================

export const CacheKeys = {
  // Employee cache keys
  employee: (tenantId: string, employeeId: string) =>
    `employee:${tenantId}:${employeeId}`,
  employeeByNumber: (tenantId: string, employeeNumber: string) =>
    `employee:${tenantId}:number:${employeeNumber}`,
  employeeList: (tenantId: string, page: number, limit: number) =>
    `employees:${tenantId}:${page}:${limit}`,

  // Leave cache keys
  leaveBalance: (tenantId: string, employeeId: string, year: number) =>
    `leave:balance:${tenantId}:${employeeId}:${year}`,
  leaveTypes: (tenantId: string) => `leave:types:${tenantId}`,

  // Attendance cache keys
  attendanceToday: (tenantId: string, employeeId: string) =>
    `attendance:today:${tenantId}:${employeeId}`,
  attendanceSchedule: (tenantId: string, employeeId: string) =>
    `attendance:schedule:${tenantId}:${employeeId}`,

  // Notification cache keys
  notificationUnread: (tenantId: string, userId: string) =>
    `notifications:unread:${tenantId}:${userId}`,
  notificationPrefs: (userId: string) => `notifications:prefs:${userId}`,

  // Dashboard cache keys
  dashboardStats: (tenantId: string, role: string) =>
    `dashboard:stats:${tenantId}:${role}`,
  dashboardAnalytics: (tenantId: string, period: string) =>
    `dashboard:analytics:${tenantId}:${period}`,

  // Branch/Department cache keys
  branches: (tenantId: string) => `branches:${tenantId}`,
  departments: (tenantId: string) => `departments:${tenantId}`,
  positions: (tenantId: string) => `positions:${tenantId}`,

  // Report cache keys
  report: (tenantId: string, type: string, params: string) =>
    `report:${tenantId}:${type}:${params}`,
} as const;

// ==========================================
// CACHE TAGS
// ==========================================

export const CacheTags = {
  // Entity tags for invalidation
  employee: (tenantId: string) => `tag:employee:${tenantId}`,
  leave: (tenantId: string) => `tag:leave:${tenantId}`,
  attendance: (tenantId: string) => `tag:attendance:${tenantId}`,
  notification: (userId: string) => `tag:notification:${userId}`,
  organization: (tenantId: string) => `tag:org:${tenantId}`,
  dashboard: (tenantId: string) => `tag:dashboard:${tenantId}`,
} as const;

// ==========================================
// TTL PRESETS
// ==========================================

export const CacheTTL = {
  /** 1 minute - for frequently changing data */
  SHORT: 60 * 1000,
  /** 5 minutes - default for most data */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutes - for semi-static data */
  LONG: 15 * 60 * 1000,
  /** 1 hour - for static reference data */
  HOUR: 60 * 60 * 1000,
  /** 24 hours - for rarely changing data */
  DAY: 24 * 60 * 60 * 1000,
} as const;

// ==========================================
// SINGLETON INSTANCE
// ==========================================

let cacheInstance: CacheManager | null = null;

/**
 * Get the cache manager singleton
 */
export function getCache(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
}

/**
 * Set custom cache store (e.g., Redis)
 */
export function setCacheStore(store: CacheStore): void {
  cacheInstance = new CacheManager(store);
}

/**
 * Clear cache singleton (for testing)
 */
export function clearCacheInstance(): void {
  if (cacheInstance) {
    cacheInstance.clear();
  }
  cacheInstance = null;
}
