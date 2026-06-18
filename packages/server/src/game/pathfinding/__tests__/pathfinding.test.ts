import { describe, it, expect, beforeEach } from 'vitest';
import { findPath } from '../Pathfinding.js';
import { PathCache } from '../PathCache.js';
import { BinaryHeap } from '../BinaryHeap.js';
import type { Grid } from '../Pathfinding.js';
import type { Waypoint } from '@arcan-gods/shared';

// ---------------------------------------------------------------------------
// MockGrid
// ---------------------------------------------------------------------------

class MockGrid implements Grid {
  private data: boolean[][];

  constructor(width: number, height: number) {
    this.data = Array.from({ length: height }, () => Array(width).fill(true));
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.getWidth() || y < 0 || y >= this.getHeight()) return false;
    return this.data[y][x];
  }

  getWidth(): number {
    return this.data[0].length;
  }

  getHeight(): number {
    return this.data.length;
  }

  setWalkable(x: number, y: number, v: boolean): void {
    this.data[y][x] = v;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check that a path is continuous (each step moves exactly 1 tile in a cardinal direction) */
function expectContinuousPath(path: Waypoint[]): void {
  for (let i = 1; i < path.length; i++) {
    const dx = Math.abs(path[i].x - path[i - 1].x);
    const dy = Math.abs(path[i].y - path[i - 1].y);
    expect(dx + dy).toBe(1);
  }
}

/** Check that every waypoint in the path is walkable on the grid */
function expectPathWalkable(grid: Grid, path: Waypoint[]): void {
  for (const wp of path) {
    expect(grid.isWalkable(wp.x, wp.y)).toBe(true);
  }
}

// ---------------------------------------------------------------------------
// BinaryHeap
// ---------------------------------------------------------------------------

describe('BinaryHeap', () => {
  it('should maintain min-heap order', () => {
    const heap = new BinaryHeap<{ score: number; id: string }>();
    heap.push({ score: 5, id: 'a' });
    heap.push({ score: 3, id: 'b' });
    heap.push({ score: 8, id: 'c' });
    heap.push({ score: 1, id: 'd' });
    heap.push({ score: 2, id: 'e' });

    expect(heap.peek()?.id).toBe('d'); // score 1
    expect(heap.size()).toBe(5);
  });

  it('should pop in priority order', () => {
    const heap = new BinaryHeap<{ score: number; id: string }>();
    heap.push({ score: 5, id: 'a' });
    heap.push({ score: 3, id: 'b' });
    heap.push({ score: 8, id: 'c' });
    heap.push({ score: 1, id: 'd' });
    heap.push({ score: 2, id: 'e' });

    const order: string[] = [];
    while (heap.size() > 0) {
      order.push(heap.pop()!.id);
    }

    expect(order).toEqual(['d', 'e', 'b', 'a', 'c']);
  });

  it('should return undefined when popping empty heap', () => {
    const heap = new BinaryHeap<{ score: number }>();
    expect(heap.pop()).toBeUndefined();
    expect(heap.peek()).toBeUndefined();
  });

  it('should clear all items', () => {
    const heap = new BinaryHeap<{ score: number }>();
    heap.push({ score: 1 });
    heap.push({ score: 2 });
    heap.clear();
    expect(heap.size()).toBe(0);
    expect(heap.pop()).toBeUndefined();
  });

  it('should handle a single element', () => {
    const heap = new BinaryHeap<{ score: number; id: string }>();
    heap.push({ score: 42, id: 'only' });
    expect(heap.peek()?.id).toBe('only');
    expect(heap.pop()?.id).toBe('only');
    expect(heap.size()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PathCache
// ---------------------------------------------------------------------------

describe('PathCache', () => {
  let cache: PathCache;

  beforeEach(() => {
    cache = new PathCache(10, 5_000);
  });

  it('should cache and return same path', () => {
    const path: Waypoint[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];

    // First call: miss
    expect(cache.get(0, 0, 2, 0)).toBeUndefined();

    // Store
    cache.set(0, 0, 2, 0, path);

    // Second call: hit — same array reference
    const cached = cache.get(0, 0, 2, 0);
    expect(cached).toBeDefined();
    expect(cached).toEqual(path);
  });

  it('should respect max size (LRU eviction)', () => {
    const smallCache = new PathCache(2, 60_000);

    smallCache.set(0, 0, 1, 0, [{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    smallCache.set(1, 0, 2, 0, [{ x: 1, y: 0 }, { x: 2, y: 0 }]);
    expect(smallCache.size()).toBe(2);

    // Add a third entry → LRU (first) should be evicted
    smallCache.set(3, 0, 4, 0, [{ x: 3, y: 0 }, { x: 4, y: 0 }]);
    expect(smallCache.size()).toBe(2);

    // The evicted key should be missing
    expect(smallCache.get(0, 0, 1, 0)).toBeUndefined();
  });

  it('should clear on invalidate', () => {
    cache.set(0, 0, 5, 0, [{ x: 0, y: 0 }, { x: 5, y: 0 }]);
    cache.set(1, 1, 3, 3, [{ x: 1, y: 1 }, { x: 3, y: 3 }]);
    expect(cache.size()).toBe(2);

    cache.invalidate();
    expect(cache.size()).toBe(0);
    expect(cache.get(0, 0, 5, 0)).toBeUndefined();
    expect(cache.get(1, 1, 3, 3)).toBeUndefined();
  });

  it('should expire entries after TTL', async () => {
    const shortCache = new PathCache(10, 10); // 10 ms TTL
    shortCache.set(0, 0, 1, 0, [{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(shortCache.get(0, 0, 1, 0)).toBeDefined();

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(shortCache.get(0, 0, 1, 0)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Pathfinding (A*)
// ---------------------------------------------------------------------------

describe('Pathfinding', () => {
  it('should find straight line path', () => {
    const grid = new MockGrid(10, 10);
    const path = findPath(grid, 0, 0, 5, 0);

    expect(path.length).toBe(6); // 0→1→2→3→4→5
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 5, y: 0 });
    expectContinuousPath(path);
  });

  it('should find path around obstacle', () => {
    const grid = new MockGrid(3, 3);
    // Block center tile (1,1)
    grid.setWalkable(1, 1, false);

    const path = findPath(grid, 0, 0, 2, 2);

    expect(path.length).toBeGreaterThan(1);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });
    expectContinuousPath(path);
    expectPathWalkable(grid, path);

    // The path should not pass through (1,1)
    for (const wp of path) {
      expect(wp.x === 1 && wp.y === 1).toBe(false);
    }
  });

  it('should return empty for non-walkable destination', () => {
    const grid = new MockGrid(5, 5);
    grid.setWalkable(3, 3, false);

    const path = findPath(grid, 0, 0, 3, 3);
    expect(path).toEqual([]);
  });

  it('should return single point when start equals end', () => {
    const grid = new MockGrid(5, 5);
    const path = findPath(grid, 2, 2, 2, 2);
    expect(path).toEqual([{ x: 2, y: 2 }]);
  });

  it('should return empty when no path exists (start surrounded)', () => {
    const grid = new MockGrid(3, 3);
    // Block all tiles adjacent to start (0,0)
    grid.setWalkable(1, 0, false); // right
    // (0,1) is blocked by grid boundary check already

    // Now (0,0) only has (0,1) as possible neighbour but it's out of bounds (non-walkable)
    // Actually (0,0) in a 3x3 grid has neighbours: (1,0) blocked, (0,1) walkable
    // Let's also block (0,1)
    grid.setWalkable(0, 1, false);

    const path = findPath(grid, 0, 0, 2, 2);
    expect(path).toEqual([]);
  });

  it('should return empty when start is completely walled off', () => {
    // Create a 3x3 grid where the start (0,0) is isolated
    const grid = new MockGrid(3, 3);
    // Block all tiles that are reachable from (0,0)
    grid.setWalkable(1, 0, false);
    grid.setWalkable(0, 1, false);
    // Goal is at (2,2)
    const path = findPath(grid, 0, 0, 2, 2);
    expect(path).toEqual([]);
  });

  it('should perform well on 50x50 grid', () => {
    const grid = new MockGrid(50, 50);
    const start = performance.now();
    const path = findPath(grid, 0, 0, 49, 49);
    const elapsed = performance.now() - start;

    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 49, y: 49 });
    expect(elapsed).toBeLessThan(50); // must complete in <50 ms
  });

  it('should cache: second identical call returns same path', () => {
    const grid = new MockGrid(10, 10);
    const cache = new PathCache();

    // First call — compute
    const path1 = findPath(grid, 1, 1, 8, 8);
    cache.set(1, 1, 8, 8, path1);

    // Second call — retrieve from cache
    const cached = cache.get(1, 1, 8, 8);
    expect(cached).toBeDefined();
    expect(cached).toEqual(path1);
  });

  it('should find path in a maze-like environment', () => {
    const grid = new MockGrid(5, 5);
    // Create a corridor: column 1 is a wall except at row 2
    grid.setWalkable(1, 0, false);
    grid.setWalkable(1, 1, false);
    // (1,2) stays walkable — the corridor
    grid.setWalkable(1, 3, false);
    grid.setWalkable(1, 4, false);

    // Block column 3 except at row 2
    grid.setWalkable(3, 0, false);
    grid.setWalkable(3, 1, false);
    // (3,2) stays walkable
    grid.setWalkable(3, 3, false);
    grid.setWalkable(3, 4, false);

    // Path from (0,0) to (4,4) should go through the corridor at row 2
    const path = findPath(grid, 0, 0, 4, 4);

    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 4, y: 4 });
    expectContinuousPath(path);
    expectPathWalkable(grid, path);
  });
});
