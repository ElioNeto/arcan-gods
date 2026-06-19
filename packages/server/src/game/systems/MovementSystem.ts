import { type Waypoint, type Direction, GAME_CONSTANTS } from '@arcan-gods/shared';
import { CollisionSystem } from './CollisionSystem.js';
import { World } from '../World.js';
import { MapManager } from '../tilemap/MapManager.js';
import { findPath } from '../pathfinding/Pathfinding.js';
import { PathCache } from '../pathfinding/PathCache.js';

/**
 * Represents an active movement request being processed over multiple ticks.
 */
export interface MoveRequest {
  playerId: string;
  path: Waypoint[];
  currentIndex: number;
  speed: number; // tiles per second
  startTime: number;
  remainder: number; // fractional tile accumulator for sub-tick movement
}

/**
 * Result returned by startPlayerMove.
 */
export interface MoveResult {
  success: boolean;
  path?: Waypoint[];
  error?: string;
}

/**
 * MovementSystem handles continuous server-authoritative movement along
 * pre-computed A* paths.
 *
 * Each tick it advances active moves by the appropriate number of tiles,
 * accumulating fractional movement so that low speeds still progress smoothly
 * across multiple ticks.
 */
export class MovementSystem {
  private activeMoves: Map<string, MoveRequest> = new Map();
  private readonly pathCache: PathCache;
  private readonly defaultSpeed: number;

  constructor(
    private readonly world: World,
    private readonly mapManager: MapManager,
    private readonly collisionSystem: CollisionSystem,
    options?: { speed?: number; maxDistance?: number },
  ) {
    this.defaultSpeed = options?.speed ?? 4;
    this.pathCache = new PathCache();
  }

  /**
   * Starts moving a player towards a destination tile.
   *
   * Validates that the destination is walkable and reachable via A*.
   * If a move is already in progress it is replaced.
   *
   * @returns `{ success, path }` on success,
   *          `{ success: false, error }` on failure.
   */
  startPlayerMove(playerId: string, destX: number, destY: number): MoveResult {
    const player = this.world.getPlayer(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    const grid = this.mapManager.getGrid(player.mapId);
    if (!grid) {
      return { success: false, error: 'Map not loaded' };
    }

    // Validate destination is in bounds and walkable
    if (!this.collisionSystem.canMoveTo(player.mapId, destX, destY)) {
      if (!grid.isInBounds(destX, destY)) {
        return { success: false, error: 'Destination is out of bounds' };
      }
      return { success: false, error: 'Destination is not walkable' };
    }

    // Trivial: player is already at destination
    if (player.x === destX && player.y === destY) {
      this.activeMoves.delete(playerId);
      return { success: true, path: [{ x: destX, y: destY }] };
    }

    // Attempt cache lookup first
    let path = this.pathCache.get(player.x, player.y, destX, destY);

    if (!path) {
      // Compute A* path
      path = findPath(grid, player.x, player.y, destX, destY);

      if (path.length === 0) {
        return { success: false, error: 'No path found to destination' };
      }

      // Cache the result
      this.pathCache.set(player.x, player.y, destX, destY, path);
    }

    // Store active move (replaces any previous one)
    this.activeMoves.set(playerId, {
      playerId,
      path,
      currentIndex: 0,
      speed: this.defaultSpeed,
      startTime: Date.now(),
      remainder: 0,
    });

    return { success: true, path };
  }

  /**
   * Immediately stops any active movement for the given player.
   */
  stopPlayerMove(playerId: string): void {
    this.activeMoves.delete(playerId);
  }

  /**
   * Processes all active movements for one tick.
   *
   * @param deltaMs - Elapsed time since the last tick in milliseconds.
   */
  update(deltaMs: number): void {
    const toRemove: string[] = [];

    for (const [playerId, move] of this.activeMoves) {
      const player = this.world.getPlayer(playerId);
      if (!player) {
        toRemove.push(playerId);
        continue;
      }

      // Accumulate fractional tile movement
      move.remainder += (move.speed * deltaMs) / 1000;

      // Consume whole tiles
      while (move.remainder >= 1 && move.currentIndex < move.path.length - 1) {
        const current = move.path[move.currentIndex];
        const next = move.path[move.currentIndex + 1];
        move.currentIndex++;
        player.x = next.x;
        player.y = next.y;
        player.direction = getDirection(current.x, current.y, next.x, next.y);
        move.remainder -= 1;

        // Consume stamina for each tile moved (P1.2)
        player.consumeStamina(GAME_CONSTANTS.STAMINA_COST_PER_TILE);
      }

      // Check if the player has arrived at the final waypoint
      if (move.currentIndex >= move.path.length - 1) {
        toRemove.push(playerId);
      }
    }

    // Cleanup completed moves
    for (const id of toRemove) {
      this.activeMoves.delete(id);
    }
  }

  /**
   * Returns the current path being followed by the player, if any.
   */
  getActivePath(playerId: string): Waypoint[] | undefined {
    return this.activeMoves.get(playerId)?.path;
  }

  /**
   * Returns whether the given player currently has an active move.
   */
  isMoving(playerId: string): boolean {
    return this.activeMoves.has(playerId);
  }

  /**
   * Returns the number of currently active movements.
   */
  getActiveMovesCount(): number {
    return this.activeMoves.size;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines the cardinal direction from (fromX, fromY) to (toX, toY).
 *
 * Both points are expected to be adjacent (Manhattan distance of 1).
 */
export function getDirection(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): Direction {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}
