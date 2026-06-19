import { describe, it, expect, beforeEach } from 'vitest';
import { MonsterFSM } from '../MonsterFSM.js';
import { Monster, type MonsterTemplate } from '../../entities/Monster.js';
import { Player } from '../../entities/Player.js';
import type { Grid } from '../../pathfinding/Pathfinding.js';

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
 * A mock grid where all tiles are walkable.
 */
class MockGrid implements Grid {
  isWalkable(_x: number, _y: number): boolean {
    return true;
  }
  getWidth(): number {
    return 100;
  }
  getHeight(): number {
    return 100;
  }
}

function createMonster(x: number, y: number, overrides?: Partial<MonsterTemplate>): Monster {
  const template = { ...TEMPLATE, ...overrides };
  return new Monster(template, x, y, 'test');
}

function createPlayer(id: string, x: number, y: number, mapId: string = 'test'): Player {
  const player = new Player('TestPlayer', 'dark_knight');
  (player as any).id = id;
  player.x = x;
  player.y = y;
  player.mapId = mapId;
  return player;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('MonsterFSM', () => {
  let fsm: MonsterFSM;
  let grid: MockGrid;

  beforeEach(() => {
    fsm = new MonsterFSM();
    grid = new MockGrid();
  });

  // ------------------------------------------------------------------
  // TC-001: Monster starts in IDLE
  // ------------------------------------------------------------------
  describe('TC-001: Initial state', () => {
    it('should start in idle state with no target', () => {
      const monster = createMonster(10, 10);
      expect(monster.currentState).toBe('idle');
      expect(monster.aggroTargetId).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // TC-002: IDLE → AGGRO when player enters aggro range
  // ------------------------------------------------------------------
  describe('TC-002: IDLE → AGGRO (or ATTACK if in attack range)', () => {
    it('should aggro when player is within aggro range but outside attack range', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 13, 10); // dist = 3 (aggro 4, attack 1)
      fsm.update(monster, [player], grid, 100, Date.now());

      expect(monster.currentState).toBe('chase'); // chase since out of attack range
      expect(monster.aggroTargetId).toBe('player-1');
    });

    it('should transition directly to attack when player is in attack range', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 10, 11); // dist = 1
      fsm.update(monster, [player], grid, 100, Date.now());

      expect(monster.currentState).toBe('attack');
      expect(monster.aggroTargetId).toBe('player-1');
    });
  });

  // ------------------------------------------------------------------
  // TC-003: IDLE remains IDLE if player out of range
  // ------------------------------------------------------------------
  describe('TC-003: IDLE stays IDLE', () => {
    it('should stay idle when player is out of aggro range', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 20, 20); // dist = 20 > 4
      fsm.update(monster, [player], grid, 100, Date.now());

      expect(monster.currentState).toBe('idle');
      expect(monster.aggroTargetId).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // TC-004: AGGRO → CHASE
  // ------------------------------------------------------------------
  describe('TC-004: AGGRO → CHASE', () => {
    it('should transition to chase with a calculated path', () => {
      const monster = createMonster(10, 10);
      const playerClose = createPlayer('player-1', 13, 10); // dist = 3 ≤ 4

      fsm.update(monster, [playerClose], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');
      expect(monster.aiMovePath.length).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------------------------------
  // TC-005: CHASE → ATTACK when in attack range
  // ------------------------------------------------------------------
  describe('TC-005: Reach attack range via chase', () => {
    it('should be in attack when monster and player overlap', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 10, 10); // dist = 0

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('attack');
    });

    it('should be in chase when player is just outside attack range', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 12, 10); // dist = 2 > attackRange 1

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');
    });

    it('should transition directly to attack when within custom attack range', () => {
      const monster = createMonster(10, 10, { attackRange: 2 });
      const player = createPlayer('player-1', 12, 10); // dist = 2 ≤ attackRange

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('attack');
    });
  });

  // ------------------------------------------------------------------
  // TC-006: ATTACK executes auto-attack at cooldown interval
  // ------------------------------------------------------------------
  describe('TC-006: ATTACK executes auto-attack', () => {
    it('should attack when cooldown has elapsed', () => {
      const now = Date.now();
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 10, 11); // dist = 1

      // Transition to attack
      fsm.update(monster, [player], grid, 100, now);
      expect(monster.currentState).toBe('attack');

      // Set lastAttackTime far in the past so cooldown has passed
      monster.lastAttackTime = now - 3000;

      const result = fsm.update(monster, [player], grid, 100, now);
      expect(result.attacked).toBe(true);
      expect(result.targetId).toBe('player-1');
    });
  });

  // ------------------------------------------------------------------
  // TC-007: ATTACK respects cooldown
  // ------------------------------------------------------------------
  describe('TC-007: ATTACK respects cooldown', () => {
    it('should not attack before cooldown has elapsed', () => {
      const now = Date.now();
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 10, 11); // dist = 1

      // Transition to attack
      fsm.update(monster, [player], grid, 100, now);
      expect(monster.currentState).toBe('attack');

      // Set lastAttackTime to recent (500ms ago, cooldown is 2000ms)
      monster.lastAttackTime = now - 500;

      const result = fsm.update(monster, [player], grid, 100, now);
      expect(result.attacked).toBe(false);
    });
  });

  // ------------------------------------------------------------------
  // TC-008: ATTACK → CHASE when player leaves attack range
  // ------------------------------------------------------------------
  describe('TC-008: ATTACK → CHASE', () => {
    it('should be in chase when player is out of attack range initially', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 10, 12); // dist = 2 > attackRange 1

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');
    });

    it('should transition from attack to chase when target moves away', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 10, 10); // dist = 0
      const now = Date.now();

      fsm.update(monster, [player], grid, 100, now);
      expect(monster.currentState).toBe('attack');

      // Player moves out of attack range
      player.y = 12; // dist = 2 > 1

      fsm.update(monster, [player], grid, 100, now);
      expect(monster.currentState).toBe('chase');
    });
  });

  // ------------------------------------------------------------------
  // TC-009: CHASE → RETURN when player leaves leash range
  // ------------------------------------------------------------------
  describe('TC-009: CHASE → RETURN', () => {
    it('should return to spawn when player moves out of leash range during chase', () => {
      const monster = createMonster(10, 10); // aggroRange=4, leashMultiplier=2 → leash=8
      const player = createPlayer('player-1', 13, 10); // dist = 3 ≤ 4 (in aggro range)

      // First, start chase
      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');

      // Player moves out of leash range
      player.x = 19; // dist = 9 > 8

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('return');
      expect(monster.aggroTargetId).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // TC-010: RETURN moves monster back to spawn
  // ------------------------------------------------------------------
  describe('TC-010: RETURN moves to spawn', () => {
    it('should move the monster toward spawn and arrive eventually', () => {
      const monster = createMonster(15, 20);
      monster.spawnX = 10;
      monster.spawnY = 10;
      monster.currentState = 'return';

      // Process ticks until idle (arrived at spawn)
      let ticks = 0;
      while (monster.currentState === 'return' && ticks < 20) {
        fsm.update(monster, [], grid, 1000, Date.now());
        ticks++;
      }

      expect(monster.currentState).toBe('idle');
      expect(monster.x).toBe(10);
      expect(monster.y).toBe(10);
    });
  });

  // ------------------------------------------------------------------
  // TC-011: RETURN → IDLE when at spawn
  // ------------------------------------------------------------------
  describe('TC-011: RETURN → IDLE', () => {
    it('should transition to idle when at spawn', () => {
      const monster = createMonster(10, 10);
      monster.currentState = 'return';

      fsm.update(monster, [], grid, 100, Date.now());
      expect(monster.currentState).toBe('idle');
    });
  });

  // ------------------------------------------------------------------
  // TC-012: RETURN interrupts chase when player leaves leash
  // ------------------------------------------------------------------
  describe('TC-012: RETURN interrupts chase', () => {
    it('should return when target exceeds leash during chase', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 13, 10); // dist=3, in aggro range

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');

      // Player moves far away
      player.x = 30; // dist = 20 > 8 (leash)

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('return');
      expect(monster.aggroTargetId).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // TC-013: IDLE patrol movement (basic)
  // ------------------------------------------------------------------
  describe('TC-013: IDLE patrol', () => {
    it('should remain idle and may start patrol after some time', () => {
      const monster = createMonster(10, 10);

      fsm.update(monster, [], grid, 100, Date.now());
      expect(monster.currentState).toBe('idle');
    });
  });

  // ------------------------------------------------------------------
  // TC-015: Patrol interrupted by player in aggro range
  // ------------------------------------------------------------------
  describe('TC-015: Patrol interrupted by aggro', () => {
    it('should interrupt patrol and aggro when player enters range', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 12, 10); // dist=2 ≤ 4

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');
    });
  });

  // ------------------------------------------------------------------
  // TC-016: CHASE calculates A* path
  // ------------------------------------------------------------------
  describe('TC-016: CHASE calculates path', () => {
    it('should have a path during chase', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 13, 10); // dist=3 ≤ 4

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');
      expect(monster.aiMovePath.length).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------------------------------
  // TC-021: Monster selects nearest player
  // ------------------------------------------------------------------
  describe('TC-021: Nearest player selection', () => {
    it('should target the nearest player within aggro range', () => {
      const monster = createMonster(10, 10);
      const player1 = createPlayer('player-1', 12, 10); // dist = 2
      const player2 = createPlayer('player-2', 14, 10); // dist = 4

      fsm.update(monster, [player1, player2], grid, 100, Date.now());
      expect(monster.aggroTargetId).toBe('player-1');
    });
  });

  // ------------------------------------------------------------------
  // TC-025: Dead monster doesn't execute AI
  // ------------------------------------------------------------------
  describe('TC-025: Dead monster AI', () => {
    it('should not process AI for dead monsters', () => {
      const monster = createMonster(10, 10);
      monster.alive = false;
      const player = createPlayer('player-1', 10, 10);

      const result = fsm.update(monster, [player], grid, 100, Date.now());
      expect(result.attacked).toBe(false);
      expect(monster.currentState).toBe('idle'); // unchanged
    });
  });

  // ------------------------------------------------------------------
  // TC-026: Monster resets AI state on respawn
  // ------------------------------------------------------------------
  describe('TC-026: AI reset on respawn', () => {
    it('should reset AI state when respawning', () => {
      const monster = createMonster(10, 10);
      monster.currentState = 'chase';
      monster.aggroTargetId = 'player-1';
      monster.aiMovePath = [{ x: 11, y: 10 }];

      monster.respawn();

      expect(monster.currentState).toBe('idle');
      expect(monster.aggroTargetId).toBeNull();
      expect(monster.aiMovePath).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // TC-027: Configurable attack cooldown
  // ------------------------------------------------------------------
  describe('TC-027: Configurable cooldown', () => {
    it('should use the template attackCooldown value', () => {
      const now = Date.now();
      const monster = createMonster(10, 10, { attackCooldown: 3000 });
      const player = createPlayer('player-1', 10, 11); // dist = 1

      // Transition to attack
      fsm.update(monster, [player], grid, 100, now);
      expect(monster.currentState).toBe('attack');

      // 2000ms is not enough (cooldown is 3000ms)
      monster.lastAttackTime = now - 2000;
      expect(fsm.update(monster, [player], grid, 100, now).attacked).toBe(false);

      // 3000ms should be enough
      monster.lastAttackTime = now - 3000;
      expect(fsm.update(monster, [player], grid, 100, now).attacked).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // TC-036: aggroRange = 0 (monster never aggros)
  // ------------------------------------------------------------------
  describe('TC-036: aggroRange = 0', () => {
    it('should never aggro when aggroRange is 0, even at same tile', () => {
      const monster = createMonster(10, 10, { aggroRange: 0 });
      const player = createPlayer('player-1', 10, 10); // same tile

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('idle');
      expect(monster.aggroTargetId).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // TC-040: Player disconnects during chase
  // ------------------------------------------------------------------
  describe('TC-040: Target disappears during chase', () => {
    it('should return to spawn when target is no longer available', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 13, 10);

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');

      // Target is gone (empty players array)
      fsm.update(monster, [], grid, 100, Date.now());
      expect(monster.currentState).toBe('return');
      expect(monster.aggroTargetId).toBeNull();
    });

    it('should return to spawn when target dies', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 13, 10);

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('chase');

      // Target dies
      player.takeDamage(999);
      expect(player.isAlive()).toBe(false);

      fsm.update(monster, [player], grid, 100, Date.now());
      expect(monster.currentState).toBe('return');
    });
  });

  // ------------------------------------------------------------------
  // TC-041: Two monsters chase same player
  // ------------------------------------------------------------------
  describe('TC-041: Multiple monsters same target', () => {
    it('should allow two monsters to independently chase the same player', () => {
      const monster1 = createMonster(10, 10);
      const monster2 = createMonster(12, 10); // dist = 2 ≤ 4 (both in range)
      const player = createPlayer('player-1', 11, 10); // dist 1 from m1, 1 from m2

      fsm.update(monster1, [player], grid, 100, Date.now());
      fsm.update(monster2, [player], grid, 100, Date.now());

      expect(monster1.currentState).toBe('attack'); // dist 1 = attackRange
      expect(monster2.currentState).toBe('attack');
      expect(monster1.aggroTargetId).toBe('player-1');
      expect(monster2.aggroTargetId).toBe('player-1');
    });
  });

  // ------------------------------------------------------------------
  // Attack then chase transition
  // ------------------------------------------------------------------
  describe('Attack then out of range', () => {
    it('should chase after attacking when player moves away', () => {
      const now = Date.now();
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 10, 11); // dist = 1

      fsm.update(monster, [player], grid, 100, now);
      expect(monster.currentState).toBe('attack');

      // Player moves out of attack range
      player.y = 13; // dist = 3 > 1, but within leash (8)

      fsm.update(monster, [player], grid, 100, now);
      expect(monster.currentState).toBe('chase');
    });
  });

  // ------------------------------------------------------------------
  // Result contains monsterId
  // ------------------------------------------------------------------
  describe('Result metadata', () => {
    it('should include monsterId in the result', () => {
      const monster = createMonster(10, 10);
      const player = createPlayer('player-1', 10, 10);

      const result = fsm.update(monster, [player], grid, 100, Date.now());
      expect(result.monsterId).toBe(monster.id);
    });

    it('should include monsterId even when not attacking', () => {
      const monster = createMonster(10, 10);
      const result = fsm.update(monster, [], grid, 100, Date.now());
      expect(result.monsterId).toBe(monster.id);
      expect(result.attacked).toBe(false);
    });
  });
});
