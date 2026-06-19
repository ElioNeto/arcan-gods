import { describe, it, expect, beforeEach } from 'vitest';
import { MonsterAISystem } from '../MonsterAISystem.js';
import { World } from '../../World.js';
import { Monster, type MonsterTemplate } from '../../entities/Monster.js';
import { Player } from '../../entities/Player.js';
import { MapManager } from '../../tilemap/MapManager.js';
import { CollisionGrid } from '../../tilemap/CollisionGrid.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const TEMPLATE: MonsterTemplate = {
  id: 'test_monster',
  name: 'Test Monster',
  level: 1,
  hp: 50,
  maxHp: 50,
  damageMin: 5,
  damageMax: 10,
  defense: 2,
  experienceReward: 10,
  goldReward: 5,
  aggroRange: 4,
  attackRange: 1,
  respawnTime: 5000,
  attackCooldown: 2000,
  moveSpeed: 3,
  leashMultiplier: 2,
  patrolRadius: 3,
  pathRecalcInterval: 500,
};

/**
 * Extends MapManager to return a fixed test grid.
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

function addPlayer(world: World, id: string, x: number, y: number, mapId: string = 'test'): Player {
  const player = new Player('TestPlayer', 'dark_knight');
  (player as any).id = id;
  player.x = x;
  player.y = y;
  player.mapId = mapId;
  player.socketId = 'socket-' + id;
  world.addPlayer(player);
  return player;
}

function addMonster(world: World, id: string, x: number, y: number, mapId: string = 'test'): Monster {
  const monster = new Monster(TEMPLATE, x, y, mapId);
  (monster as any).id = id;
  world.addMonster(monster);
  return monster;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('MonsterAISystem', () => {
  let world: World;
  let grid: CollisionGrid;
  let mapManager: MockMapManager;
  let aiSystem: MonsterAISystem;

  beforeEach(() => {
    world = new World();
    grid = createWalkableGrid(50, 50);
    mapManager = new MockMapManager(grid);
    aiSystem = new MonsterAISystem(world, mapManager, { staggerGroups: 3 });
  });

  // ---------------------------------------------------------------
  // Stagger: only subset of monsters processed per tick
  // ---------------------------------------------------------------
  describe('Stagger', () => {
    it('should process only a subset of monsters per tick', () => {
      for (let i = 0; i < 10; i++) {
        addMonster(world, `monster-${i}`, 10 + i, 10);
      }

      // Tick 0: process group 0
      const results0 = aiSystem.update(100, 0);
      expect(results0.length).toBeLessThan(10);
      expect(results0.length).toBeGreaterThan(0);

      // Tick 1: process group 1
      const results1 = aiSystem.update(100, 1);
      expect(results1.length).toBeGreaterThan(0);
    });

    it('should process all monsters over 3 ticks', () => {
      const processedIds = new Set<string>();

      for (let i = 0; i < 10; i++) {
        addMonster(world, `monster-${i}`, 10 + i, 10);
      }

      // Run 3 ticks to cover all groups
      for (let tick = 0; tick < 3; tick++) {
        const results = aiSystem.update(100, tick);
        for (const r of results) {
          processedIds.add(r.monsterId);
        }
      }

      expect(processedIds.size).toBe(10);
    });
  });

  // ---------------------------------------------------------------
  // Dead monster not processed
  // ---------------------------------------------------------------
  describe('Dead monsters', () => {
    it('should skip dead monsters', () => {
      const monster = addMonster(world, 'monster-1', 10, 10);
      addPlayer(world, 'player-1', 12, 10);
      monster.alive = false;

      const results = aiSystem.update(100, 0);
      expect(results.length).toBe(0);
      expect(monster.currentState).toBe('idle');
    });
  });

  // ---------------------------------------------------------------
  // Monster in attack state when player is in range
  // ---------------------------------------------------------------
  describe('Monster attacks player', () => {
    it('should be in attack state when player is in attack range', () => {
      const monster = addMonster(world, 'monster-1', 10, 10);
      addPlayer(world, 'player-1', 10, 10); // same tile

      aiSystem.update(100, 0);
      expect(monster.currentState).toBe('attack');
      expect(monster.aggroTargetId).toBe('player-1');
    });
  });

  // ---------------------------------------------------------------
  // Monster chases player
  // ---------------------------------------------------------------
  describe('Monster chases player', () => {
    it('should chase player within aggro range but outside attack range', () => {
      const monster = addMonster(world, 'monster-1', 10, 10);
      addPlayer(world, 'player-1', 13, 10); // dist = 3 (aggro 4, attack 1)

      aiSystem.update(100, 0);
      expect(monster.currentState).toBe('chase');
      expect(monster.aggroTargetId).toBe('player-1');
    });
  });

  // ---------------------------------------------------------------
  // Returns from chase when player out of leash
  // ---------------------------------------------------------------
  describe('Return from chase', () => {
    it('should return when player moves out of leash during chase', () => {
      // Use staggerGroups=1 to process every tick
      const sys = new MonsterAISystem(world, mapManager, { staggerGroups: 1 });
      const monster = addMonster(world, 'monster-1', 10, 10);
      const player = addPlayer(world, 'player-1', 13, 10); // dist = 3, in aggro range

      // Start chase
      sys.update(100, 0);
      expect(monster.currentState).toBe('chase');

      // Move player out of leash range
      player.x = 30; // dist = 20 > 8

      sys.update(100, 1);
      expect(monster.currentState).toBe('return');
      expect(monster.aggroTargetId).toBeNull();
    });

    it('should not return when player is far away but monster never aggrod', () => {
      const monster = addMonster(world, 'monster-1', 10, 10);
      addPlayer(world, 'player-1', 19, 10); // dist = 9 > aggro range 4

      // Monster doesn't know about this player
      aiSystem.update(100, 0);
      expect(monster.currentState).toBe('idle');
    });
  });

  // ---------------------------------------------------------------
  // Stagger group count
  // ---------------------------------------------------------------
  describe('Configuration', () => {
    it('should have configurable stagger groups', () => {
      const system = new MonsterAISystem(world, mapManager, { staggerGroups: 5 });
      expect(system.getStaggerGroups()).toBe(5);
    });

    it('should default to 3 stagger groups', () => {
      const system = new MonsterAISystem(world, mapManager);
      expect(system.getStaggerGroups()).toBe(3);
    });
  });
});
