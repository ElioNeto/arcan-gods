import { describe, it, expect, beforeEach } from 'vitest';
import { MovementSystem, getDirection } from '../MovementSystem.js';
import { CollisionGrid } from '../../tilemap/CollisionGrid.js';
import { CollisionSystem } from '../CollisionSystem.js';
import { MapManager } from '../../tilemap/MapManager.js';
import { World } from '../../World.js';
import { Player } from '../../entities/Player.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Creates an all-walkable CollisionGrid of the given dimensions.
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

/**
 * Extends MockMapManager from collision tests: returns a fixed test grid.
 */
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

/**
 * Helper to create a mock player and add it to the world.
 */
function addPlayerToWorld(
  world: World,
  id: string,
  x: number,
  y: number,
  mapId: string = 'test',
): Player {
  const player = new Player('TestPlayer', 'dark_knight');
  (player as any).id = id;
  player.x = x;
  player.y = y;
  player.mapId = mapId;
  player.socketId = 'socket-' + id;
  world.addPlayer(player);
  return player;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('MovementSystem', () => {
  let world: World;
  let grid: CollisionGrid;
  let mapManager: MockMapManager;
  let collisionSystem: CollisionSystem;
  let movementSystem: MovementSystem;

  beforeEach(() => {
    world = new World();
    grid = createWalkableGrid(20, 20);
    mapManager = new MockMapManager(grid);
    collisionSystem = new CollisionSystem(mapManager, world);
    movementSystem = new MovementSystem(world, mapManager, collisionSystem, { speed: 4 });
  });

  // ---------------------------------------------------------------
  // startPlayerMove
  // ---------------------------------------------------------------

  describe('startPlayerMove', () => {
    it('should succeed and return a path for a walkable destination', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);
      const result = movementSystem.startPlayerMove('player-1', 10, 10);

      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
      expect(result.path!.length).toBeGreaterThan(0);
      // Path should start at player position and end at destination
      expect(result.path![0]).toEqual({ x: 5, y: 5 });
      expect(result.path![result.path!.length - 1]).toEqual({ x: 10, y: 10 });
    });

    it('should fail when the player does not exist', () => {
      const result = movementSystem.startPlayerMove('non-existent', 10, 10);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail when the destination is out of bounds', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);
      const result = movementSystem.startPlayerMove('player-1', -1, 5);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Destination is out of bounds');
    });

    it('should fail when the destination is not walkable', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);
      grid.setWalkable(10, 10, false);

      const result = movementSystem.startPlayerMove('player-1', 10, 10);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Destination is not walkable');
    });

    it('should fail when no path exists (destination isolated)', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);

      // Block all tiles around the destination so it's unreachable
      grid.setWalkable(9, 10, false);
      grid.setWalkable(11, 10, false);
      grid.setWalkable(10, 9, false);
      grid.setWalkable(10, 11, false);

      const result = movementSystem.startPlayerMove('player-1', 10, 10);
      expect(result.success).toBe(false);
      expect(result.error).toBe('No path found to destination');
    });

    it('should succeed immediately when player is already at destination', () => {
      addPlayerToWorld(world, 'player-1', 10, 10);
      const result = movementSystem.startPlayerMove('player-1', 10, 10);

      expect(result.success).toBe(true);
      expect(result.path).toEqual([{ x: 10, y: 10 }]);
      expect(movementSystem.isMoving('player-1')).toBe(false);
    });

    it('should replace an existing active move with a new one', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);
      movementSystem.startPlayerMove('player-1', 10, 5);
      expect(movementSystem.isMoving('player-1')).toBe(true);

      // Start a new move
      const result = movementSystem.startPlayerMove('player-1', 5, 10);
      expect(result.success).toBe(true);
      expect(movementSystem.isMoving('player-1')).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // update — single-step movement
  // ---------------------------------------------------------------

  describe('update', () => {
    it('should move the player one tile when enough time passes', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      movementSystem.startPlayerMove('player-1', 5, 10);

      // Speed is 4 tiles/sec, so 250ms = 1 tile
      movementSystem.update(250);

      expect(player.x).toBe(5);
      expect(player.y).toBe(6);
      expect(player.direction).toBe('down');
    });

    it('should move the player along multiple waypoints', () => {
      const player = addPlayerToWorld(world, 'player-1', 0, 0);
      movementSystem.startPlayerMove('player-1', 3, 0);

      // The path from (0,0) to (3,0) on a walkable grid: (0,0)->(1,0)->(2,0)->(3,0)
      // At 4 tiles/sec, 250ms = 1 tile. 750ms = 3 tiles (arrive)
      movementSystem.update(750);

      expect(player.x).toBe(3);
      expect(player.y).toBe(0);
      // After arriving, movement should be cleaned up
      expect(movementSystem.isMoving('player-1')).toBe(false);
    });

    it('should smoothly accumulate fractional movement across ticks', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      movementSystem.startPlayerMove('player-1', 5, 8); // 3 tiles down

      // Two ticks at 100ms each = 200ms = 0.8 tiles accumulated (4 tiles/sec)
      movementSystem.update(100);
      movementSystem.update(100);

      // 0.8 < 1, so no tile should have been moved yet
      expect(player.x).toBe(5);
      expect(player.y).toBe(5);

      // Third tick: 100ms -> total 300ms = 1.2 tiles -> 1 tile moved
      movementSystem.update(100);
      expect(player.y).toBe(6);
    });

    it('should stop moving the player after stopPlayerMove', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      movementSystem.startPlayerMove('player-1', 5, 10);

      movementSystem.update(250); // Move 1 tile
      expect(player.y).toBe(6);

      movementSystem.stopPlayerMove('player-1');

      movementSystem.update(500); // Would move more if not stopped
      expect(player.y).toBe(6); // Should not have moved further
    });

    it('should remove players that no longer exist in the world', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);
      movementSystem.startPlayerMove('player-1', 10, 10);
      expect(movementSystem.getActiveMovesCount()).toBe(1);

      // Remove the player
      world.removePlayer('player-1');

      movementSystem.update(100);
      expect(movementSystem.getActiveMovesCount()).toBe(0);
    });

    it('should clean up completed moves after arrival', () => {
      addPlayerToWorld(world, 'player-1', 0, 0);
      movementSystem.startPlayerMove('player-1', 0, 2); // 2 tiles

      expect(movementSystem.getActiveMovesCount()).toBe(1);

      // 2 tiles at 4 tiles/sec = 500ms
      movementSystem.update(500);

      expect(movementSystem.getActiveMovesCount()).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // isMoving
  // ---------------------------------------------------------------

  describe('isMoving', () => {
    it('should return false when no move has been started', () => {
      expect(movementSystem.isMoving('player-1')).toBe(false);
    });

    it('should return true after starting a move', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);
      movementSystem.startPlayerMove('player-1', 10, 10);
      expect(movementSystem.isMoving('player-1')).toBe(true);
    });

    it('should return false after the move completes', () => {
      addPlayerToWorld(world, 'player-1', 0, 0);
      movementSystem.startPlayerMove('player-1', 0, 1); // 1 tile
      movementSystem.update(250); // 1 tile at 4 tiles/sec

      expect(movementSystem.isMoving('player-1')).toBe(false);
    });

    it('should return false after stopPlayerMove', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);
      movementSystem.startPlayerMove('player-1', 10, 10);
      movementSystem.stopPlayerMove('player-1');
      expect(movementSystem.isMoving('player-1')).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // getActivePath
  // ---------------------------------------------------------------

  describe('getActivePath', () => {
    it('should return undefined when player is not moving', () => {
      expect(movementSystem.getActivePath('player-1')).toBeUndefined();
    });

    it('should return the current path when player is moving', () => {
      addPlayerToWorld(world, 'player-1', 5, 5);
      const result = movementSystem.startPlayerMove('player-1', 10, 10);
      expect(movementSystem.getActivePath('player-1')).toEqual(result.path);
    });
  });

  // ---------------------------------------------------------------
  // getActiveMovesCount
  // ---------------------------------------------------------------

  describe('getActiveMovesCount', () => {
    it('should return 0 initially', () => {
      expect(movementSystem.getActiveMovesCount()).toBe(0);
    });

    it('should return the number of active moves', () => {
      addPlayerToWorld(world, 'player-1', 0, 0);
      addPlayerToWorld(world, 'player-2', 5, 5);
      addPlayerToWorld(world, 'player-3', 10, 10);

      movementSystem.startPlayerMove('player-1', 5, 0);
      movementSystem.startPlayerMove('player-2', 10, 5);

      expect(movementSystem.getActiveMovesCount()).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// getDirection
// ---------------------------------------------------------------------------

describe('getDirection', () => {
  it('should return "down" when moving south', () => {
    expect(getDirection(5, 5, 5, 6)).toBe('down');
  });

  it('should return "up" when moving north', () => {
    expect(getDirection(5, 5, 5, 4)).toBe('up');
  });

  it('should return "right" when moving east', () => {
    expect(getDirection(5, 5, 6, 5)).toBe('right');
  });

  it('should return "left" when moving west', () => {
    expect(getDirection(5, 5, 4, 5)).toBe('left');
  });

  it('should prefer vertical direction when dx and dy are equal', () => {
    // When |dx| === |dy|, function picks vertical
    expect(getDirection(0, 0, 5, 5)).toBe('down');
  });

  it('should prefer vertical direction when dy > dx', () => {
    expect(getDirection(0, 0, 1, 5)).toBe('down');
  });

  it('should prefer horizontal direction when dx > dy', () => {
    expect(getDirection(0, 0, 5, 1)).toBe('right');
  });

  it('should return "left" for negative dx', () => {
    expect(getDirection(5, 5, 0, 5)).toBe('left');
  });

  it('should return "up" for negative dy', () => {
    expect(getDirection(5, 5, 5, 0)).toBe('up');
  });
});
