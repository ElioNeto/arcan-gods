import { MapManager } from '../tilemap/MapManager.js';
import { World } from '../World.js';
import type { CollisionResult, IPortal } from '@arcan-gods/shared';

/**
 * Handles collision detection and movement validation for game entities.
 *
 * Provides tile-based collision checking with sliding support (wall-hugging),
 * path validation, and neighbor discovery.
 *
 * Entity-vs-entity collision detection is reserved for a future iteration.
 */
export class CollisionSystem {
  constructor(
    private readonly mapManager: MapManager,
    /** @internal Reserved for future entity-vs-entity collision checks. */
    _world: World,
  ) {}

  // ---------------------------------------------------------------
  // Movement validation
  // ---------------------------------------------------------------

  /**
   * Checks whether an entity can move to tile (x, y) on the given map.
   *
   * Validates grid bounds and tile walkability.
   *
   * @param mapId    - Target map identifier
   * @param x        - Target tile X
   * @param y        - Target tile Y
   * @param _entityId - Reserved for future entity-overlap checks
   */
  canMoveTo(mapId: string, x: number, y: number, _entityId?: string): boolean {
    const grid = this.mapManager.getGrid(mapId);
    if (!grid.isInBounds(x, y)) return false;
    return grid.isWalkable(x, y);
  }

  // ---------------------------------------------------------------
  // Movement execution with sliding
  // ---------------------------------------------------------------

  /**
   * Attempts to move an entity from (fromX, fromY) toward (toX, toY).
   *
   * If the destination tile is blocked the system tries to slide along
   * each axis independently (wall-hugging behaviour):
   *   1. Try full move to (toX, toY)
   *   2. If blocked, try X-only move to (toX, fromY)
   *   3. If blocked, try Y-only move to (fromX, toY)
   *   4. If both axes blocked, stay in place
   *
   * @param mapId    - Current map identifier
   * @param fromX    - Current tile X
   * @param fromY    - Current tile Y
   * @param toX      - Desired tile X
   * @param toY      - Desired tile Y
   * @param _entityId - Reserved for future entity-overlap checks
   */
  tryMove(
    mapId: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    _entityId?: string,
  ): CollisionResult {
    // 1. Full movement — destination is clear
    if (this.canMoveTo(mapId, toX, toY)) {
      return {
        collided: false,
        blockedX: false,
        blockedY: false,
        newX: toX,
        newY: toY,
      };
    }

    // 2. Try sliding along the X axis (keep target X, stay at original Y)
    if (this.canMoveTo(mapId, toX, fromY)) {
      return {
        collided: true,
        collisionType: 'tile',
        blockedX: false,
        blockedY: true, // Y movement was blocked, entity slid on X
        newX: toX,
        newY: fromY,
      };
    }

    // 3. Try sliding along the Y axis (keep target Y, stay at original X)
    if (this.canMoveTo(mapId, fromX, toY)) {
      return {
        collided: true,
        collisionType: 'tile',
        blockedX: true, // X movement was blocked, entity slid on Y
        blockedY: false,
        newX: fromX,
        newY: toY,
      };
    }

    // 4. Fully blocked — entity stays in place
    return {
      collided: true,
      collisionType: 'tile',
      blockedX: true,
      blockedY: true,
      newX: fromX,
      newY: fromY,
    };
  }

  // ---------------------------------------------------------------
  // Path validation
  // ---------------------------------------------------------------

  /**
   * Checks whether a complete path (array of waypoints) consists entirely
   * of walkable tiles on the given map.
   *
   * An empty path is considered invalid.
   */
  isPathWalkable(mapId: string, path: Array<{ x: number; y: number }>): boolean {
    if (path.length === 0) return false;

    for (const point of path) {
      if (!this.canMoveTo(mapId, point.x, point.y)) {
        return false;
      }
    }

    return true;
  }

  // ---------------------------------------------------------------
  // Neighbour discovery
  // ---------------------------------------------------------------

  /** Ordered 4-directional offsets: north, east, south, west. */
  private static readonly NEIGHBOR_DIRS: ReadonlyArray<[number, number]> = [
    [0, -1], // north
    [1, 0],  // east
    [0, 1],  // south
    [-1, 0], // west
  ];

  /**
   * Returns the four cardinal neighbours of (x, y) that are within bounds
   * and walkable on the given map.
   */
  getWalkableNeighbors(mapId: string, x: number, y: number): Array<{ x: number; y: number }> {
    const neighbors: Array<{ x: number; y: number }> = [];

    for (const [dx, dy] of CollisionSystem.NEIGHBOR_DIRS) {
      const nx = x + dx;
      const ny = y + dy;

      if (this.canMoveTo(mapId, nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  // ---------------------------------------------------------------
  // Portal detection
  // ---------------------------------------------------------------

  /**
   * Checks whether tile (x, y) lies inside a portal zone on the given map.
   *
   * @returns The portal definition if found, `null` otherwise.
   */
  getPortalAt(mapId: string, x: number, y: number): IPortal | null {
    return this.mapManager.getPortalAt(mapId, x, y);
  }
}
