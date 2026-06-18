import type { Waypoint } from '@arcan-gods/shared';

interface CacheEntry {
  path: Waypoint[];
  expiresAt: number;
}

/**
 * LRU-aware cache for A* pathfinding results.
 *
 * - Keys are formatted as `${startX},${startY}-${endX},${endY}`
 * - Max 1000 entries by default (LRU eviction on overflow)
 * - TTL of 5 seconds by default
 * - `invalidate()` clears the entire cache (e.g. when the collision grid changes)
 */
export class PathCache {
  private cache: Map<string, CacheEntry>;
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 1000, ttlMs = 5_000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Builds a deterministic cache key from start/end coordinates.
   */
  static makeKey(startX: number, startY: number, endX: number, endY: number): string {
    return `${startX},${startY}-${endX},${endY}`;
  }

  /**
   * Retrieves a cached path if it exists and has not expired.
   * Accessing an entry promotes it (LRU behavior).
   */
  get(startX: number, startY: number, endX: number, endY: number): Waypoint[] | undefined {
    const key = PathCache.makeKey(startX, startY, endX, endY);
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    // TTL expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // LRU promotion: delete and re-insert so the entry moves to the end
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.path;
  }

  /**
   * Stores a path in the cache.
   * If the cache is at capacity, the least-recently-used entry (first inserted) is evicted.
   */
  set(startX: number, startY: number, endX: number, endY: number, path: Waypoint[]): void {
    const key = PathCache.makeKey(startX, startY, endX, endY);

    // Evict LRU entry (the first key in insertion order) when at capacity
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.cache.keys().next().value;
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, {
      path,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Clears all cached paths. Called when the collision grid changes.
   */
  invalidate(): void {
    this.cache.clear();
  }

  /**
   * Returns the current number of entries in the cache.
   */
  size(): number {
    return this.cache.size;
  }
}
