import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionGrid } from '../../tilemap/CollisionGrid.js';
import { MapManager } from '../../tilemap/MapManager.js';
import { World } from '../../World.js';
import { CollisionSystem } from '../CollisionSystem.js';
import type { IPortal } from '@arcan-gods/shared';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Creates a 10×10 all-walkable grid and wraps it in a MapManager subclass so
 * that `getGrid` returns the test grid regardless of which mapId is requested.
 */
function createWalkableGrid(width: number, height: number): CollisionGrid {
  const data: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      row.push(true);
    }
    data.push(row);
  }
  return new CollisionGrid(data);
}

class MockMapManager extends MapManager {
  private readonly testGrid: CollisionGrid;

  constructor(grid: CollisionGrid) {
    super();
    this.testGrid = grid;
  }

  override getGrid(_mapId: string): CollisionGrid {
    return this.testGrid;
  }
}

/** Minimal World subclass — no entity overlap logic needed yet. */
class MockWorld extends World {
  constructor() {
    super();
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CollisionSystem', () => {
  let system: CollisionSystem;
  let grid: CollisionGrid;

  beforeEach(() => {
    grid = createWalkableGrid(10, 10);
    const mapManager = new MockMapManager(grid);
    const world = new MockWorld();
    system = new CollisionSystem(mapManager, world);
  });

  // ---------------------------------------------------------------
  // canMoveTo
  // ---------------------------------------------------------------

  describe('canMoveTo', () => {
    it('should return true for a walkable tile', () => {
      expect(system.canMoveTo('test', 1, 1)).toBe(true);
    });

    it('should return false for a non-walkable tile', () => {
      grid.setWalkable(5, 0, false);
      expect(system.canMoveTo('test', 5, 0)).toBe(false);
    });

    it('should return false for out-of-bounds coordinates', () => {
      // Negative coordinates
      expect(system.canMoveTo('test', -1, 0)).toBe(false);
      expect(system.canMoveTo('test', 0, -1)).toBe(false);

      // Beyond grid bounds (grid is 10×10)
      expect(system.canMoveTo('test', 10, 0)).toBe(false);
      expect(system.canMoveTo('test', 0, 10)).toBe(false);
      expect(system.canMoveTo('test', -5, -5)).toBe(false);
      expect(system.canMoveTo('test', 100, 100)).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // tryMove
  // ---------------------------------------------------------------

  describe('tryMove', () => {
    it('should move freely when destination is walkable', () => {
      const result = system.tryMove('test', 1, 1, 3, 4);

      expect(result.collided).toBe(false);
      expect(result.blockedX).toBe(false);
      expect(result.blockedY).toBe(false);
      expect(result.newX).toBe(3);
      expect(result.newY).toBe(4);
    });

    it('should return blockedX true when X movement is blocked but Y slides', () => {
      // Block diagonal (3,3) and the X-slide target (3,2)
      // so the only clear slide is along Y → (2,3)
      grid.setWalkable(3, 3, false);
      grid.setWalkable(3, 2, false);

      const result = system.tryMove('test', 2, 2, 3, 3);

      expect(result.collided).toBe(true);
      expect(result.collisionType).toBe('tile');
      expect(result.blockedX).toBe(true);
      expect(result.blockedY).toBe(false);
      expect(result.newX).toBe(2);
      expect(result.newY).toBe(3);
    });

    it('should return blockedY true when Y movement is blocked but X slides', () => {
      // Block diagonal (3,3) and the Y-slide target (2,3)
      // so the only clear slide is along X → (3,2)
      grid.setWalkable(3, 3, false);
      grid.setWalkable(2, 3, false);

      const result = system.tryMove('test', 2, 2, 3, 3);

      expect(result.collided).toBe(true);
      expect(result.collisionType).toBe('tile');
      expect(result.blockedX).toBe(false);
      expect(result.blockedY).toBe(true);
      expect(result.newX).toBe(3);
      expect(result.newY).toBe(2);
    });

    it('should stay in place when both axes are blocked', () => {
      // Block all three destination tiles around (2,2)
      grid.setWalkable(3, 3, false);
      grid.setWalkable(3, 2, false);
      grid.setWalkable(2, 3, false);

      const result = system.tryMove('test', 2, 2, 3, 3);

      expect(result.collided).toBe(true);
      expect(result.blockedX).toBe(true);
      expect(result.blockedY).toBe(true);
      expect(result.newX).toBe(2);
      expect(result.newY).toBe(2);
    });

    it('should not collide when moving to the same tile', () => {
      const result = system.tryMove('test', 5, 5, 5, 5);

      expect(result.collided).toBe(false);
      expect(result.newX).toBe(5);
      expect(result.newY).toBe(5);
    });
  });

  // ---------------------------------------------------------------
  // isPathWalkable
  // ---------------------------------------------------------------

  describe('isPathWalkable', () => {
    it('should return true for a valid path', () => {
      const path = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
      ];
      expect(system.isPathWalkable('test', path)).toBe(true);
    });

    it('should return false when a path tile is blocked', () => {
      grid.setWalkable(2, 1, false);

      const path = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
      ];
      expect(system.isPathWalkable('test', path)).toBe(false);
    });

    it('should return false for an empty path', () => {
      expect(system.isPathWalkable('test', [])).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // getWalkableNeighbors
  // ---------------------------------------------------------------

  describe('getWalkableNeighbors', () => {
    it('should return 4 neighbors for an interior tile', () => {
      const neighbors = system.getWalkableNeighbors('test', 5, 5);

      expect(neighbors).toHaveLength(4);
      expect(neighbors).toContainEqual({ x: 5, y: 4 }); // north
      expect(neighbors).toContainEqual({ x: 6, y: 5 }); // east
      expect(neighbors).toContainEqual({ x: 5, y: 6 }); // south
      expect(neighbors).toContainEqual({ x: 4, y: 5 }); // west
    });

    it('should return fewer neighbors at the grid border', () => {
      const topLeft = system.getWalkableNeighbors('test', 0, 0);
      expect(topLeft).toHaveLength(2);
      expect(topLeft).toContainEqual({ x: 1, y: 0 }); // east
      expect(topLeft).toContainEqual({ x: 0, y: 1 }); // south

      const bottomRight = system.getWalkableNeighbors('test', 9, 9);
      expect(bottomRight).toHaveLength(2);
      expect(bottomRight).toContainEqual({ x: 8, y: 9 }); // west
      expect(bottomRight).toContainEqual({ x: 9, y: 8 }); // north
    });

    it('should exclude blocked neighbors', () => {
      grid.setWalkable(6, 5, false); // block east neighbor of (5,5)

      const neighbors = system.getWalkableNeighbors('test', 5, 5);

      expect(neighbors).toHaveLength(3);
      expect(neighbors).not.toContainEqual({ x: 6, y: 5 });
    });

    it('should return 0 neighbors when completely surrounded by blocked tiles', () => {
      // Block all 4 neighbors of (5,5)
      grid.setWalkable(5, 4, false);
      grid.setWalkable(6, 5, false);
      grid.setWalkable(5, 6, false);
      grid.setWalkable(4, 5, false);

      const neighbors = system.getWalkableNeighbors('test', 5, 5);
      expect(neighbors).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------
  // getPortalAt
  // ---------------------------------------------------------------

  describe('getPortalAt', () => {
    it('should return null when no portal exists at the given tile', () => {
      expect(system.getPortalAt('test', 0, 0)).toBeNull();
    });

    it('should delegate to MapManager.getPortalAt for portal coordinates', () => {
      // Extend MockMapManager to simulate a portal
      const portal: IPortal = {
        x: 5,
        y: 5,
        width: 1,
        height: 1,
        targetMap: 'lorencia',
        targetX: 10,
        targetY: 10,
        label: 'test-portal',
      };

      class PortalMapManager extends MockMapManager {
        override getPortalAt(_mapId: string, x: number, y: number): IPortal | null {
          if (x >= portal.x && x < portal.x + portal.width && y >= portal.y && y < portal.y + portal.height) {
            return portal;
          }
          return null;
        }
      }

      const portalManager = new PortalMapManager(grid);
      const world = new MockWorld();
      const sys = new CollisionSystem(portalManager, world);

      expect(sys.getPortalAt('test', 5, 5)).toBe(portal);
      expect(sys.getPortalAt('test', 0, 0)).toBeNull();
    });
  });
});
