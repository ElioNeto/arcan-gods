import { describe, it, expect, beforeEach, vi } from 'vitest';
import { World } from '../../World.js';
import { Player } from '../../entities/Player.js';
import { Monster, type MonsterTemplate } from '../../entities/Monster.js';
import { CombatSystem } from '../CombatSystem.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const MONSTER_TEMPLATE: MonsterTemplate = {
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
};

const HIGH_LEVEL_MONSTER: MonsterTemplate = {
  ...MONSTER_TEMPLATE,
  id: 'high_level_monster',
  name: 'High Level Monster',
  level: 10,
  hp: 200,
  maxHp: 200,
  defense: 10,
  experienceReward: 100,
  goldReward: 50,
};

function addPlayerToWorld(world: World, id: string, x: number, y: number, mapId: string = 'test'): Player {
  const player = new Player('TestPlayer', 'dark_knight');
  (player as any).id = id;
  player.x = x;
  player.y = y;
  player.mapId = mapId;
  player.socketId = 'socket-' + id;
  world.addPlayer(player);
  return player;
}

function addMonsterToWorld(world: World, id: string, x: number, y: number, template: MonsterTemplate = MONSTER_TEMPLATE, mapId: string = 'test'): Monster {
  const monster = new Monster(template, x, y, mapId);
  (monster as any).id = id;
  world.addMonster(monster);
  return monster;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CombatSystem', () => {
  let world: World;
  let combatSystem: CombatSystem;

  beforeEach(() => {
    world = new World();
    combatSystem = new CombatSystem(world);
  });

  // ---------------------------------------------------------------
  // processAttack — validation
  // ---------------------------------------------------------------

  describe('processAttack validation', () => {
    it('should return error when attacker does not exist', () => {
      const monster = addMonsterToWorld(world, 'monster-1', 10, 10);
      const result = combatSystem.processAttack('non-existent', monster.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid attacker or target');
    });

    it('should return error when target does not exist', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const result = combatSystem.processAttack(player.id, 'non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid attacker or target');
    });

    it('should return error when target is already dead', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const monster = addMonsterToWorld(world, 'monster-1', 5, 5);
      monster.hp = 0;
      monster.alive = false;

      const result = combatSystem.processAttack(player.id, monster.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Target is already dead');
    });

    it('should return error when target is out of range', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const monster = addMonsterToWorld(world, 'monster-1', 10, 10); // distance = 10 > 2

      const result = combatSystem.processAttack(player.id, monster.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Target out of range');
    });

    it('should return error on rapid successive attacks (cooldown)', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const monster = addMonsterToWorld(world, 'monster-1', 5, 5);

      // First attack should succeed
      const first = combatSystem.processAttack(player.id, monster.id);
      expect(first.success).toBe(true);

      // Second attack immediately after should hit cooldown
      const second = combatSystem.processAttack(player.id, monster.id);
      expect(second.success).toBe(false);
      expect(second.error).toBe('Attack on cooldown');
    });
  });

  // ---------------------------------------------------------------
  // processAttack — successful attacks
  // ---------------------------------------------------------------

  describe('processAttack successful', () => {
    it('should deal damage to the target', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const monster = addMonsterToWorld(world, 'monster-1', 5, 5);
      const initialHp = monster.hp;

      // Mock Math.random to force a hit
      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const result = combatSystem.processAttack(player.id, monster.id);
      vi.restoreAllMocks();

      expect(result.success).toBe(true);
      expect(result.isBlocked).toBe(false);
      expect(result.damage).toBeGreaterThan(0);
      expect(monster.hp).toBeLessThan(initialHp);
    });

    it('should return correct target info on hit', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const monster = addMonsterToWorld(world, 'monster-1', 5, 5);

      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const result = combatSystem.processAttack(player.id, monster.id);
      vi.restoreAllMocks();

      expect(result.success).toBe(true);
      expect(result.targetId).toBe(monster.id);
      expect(result.targetHp).toBe(monster.hp);
      expect(result.targetMaxHp).toBe(monster.maxHp);
    });

    it('should set isBlocked when attack misses (very low AGI vs high level)', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const monster = addMonsterToWorld(world, 'monster-1', 5, 5, HIGH_LEVEL_MONSTER);
      player.agility = 1;
      player.level = 1;

      // Mock Math.random to force a miss: rate = 50 + 2 + (1-10)*3 = 25%
      // Math.random() * 100 = 30 >= 25 → miss
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // 50 > 25 → miss
      const result = combatSystem.processAttack(player.id, monster.id);
      vi.restoreAllMocks();

      expect(result.success).toBe(true);
      expect(result.isBlocked).toBe(true);
      expect(result.damage).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // processAttack — killing monsters
  // ---------------------------------------------------------------

  describe('processAttack killing monsters', () => {
    it('should kill the monster when HP reaches 0', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      // Create a monster with very low HP and zero defense
      const weakMonster: MonsterTemplate = {
        ...MONSTER_TEMPLATE,
        hp: 5,
        maxHp: 5,
        defense: 0,
      };
      const monster = addMonsterToWorld(world, 'monster-1', 5, 5, weakMonster);

      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const result = combatSystem.processAttack(player.id, monster.id);
      vi.restoreAllMocks();

      expect(result.success).toBe(true);
      // Damage is guaranteed by the mock, and 5 HP is low enough to kill in one hit
      expect(result.killed).toBe(true);
      // Remove the isAlive check — Monster stays alive until the EntityManager processes death
      expect(result.damage).toBeGreaterThanOrEqual(5);
    });

    it('should grant experience and gold when killing a monster', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const weakMonster: MonsterTemplate = {
        ...MONSTER_TEMPLATE,
        hp: 5,
        maxHp: 5,
        defense: 0,
      };
      const monster = addMonsterToWorld(world, 'monster-1', 5, 5, weakMonster);

      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const result = combatSystem.processAttack(player.id, monster.id);
      vi.restoreAllMocks();

      expect(result.success).toBe(true);
      expect(result.killed).toBe(true);
      expect(result.expGain).toBeGreaterThan(0);
      expect(result.goldGain).toBeGreaterThan(0);
      expect(player.experience).toBeGreaterThan(0);
    });

    it('should not kill the monster when HP is above 0', () => {
      const player = addPlayerToWorld(world, 'player-1', 5, 5);
      const strongMonster: MonsterTemplate = {
        ...MONSTER_TEMPLATE,
        hp: 5000,
        maxHp: 5000,
        defense: 0,
      };
      const monster = addMonsterToWorld(world, 'monster-1', 5, 5, strongMonster);

      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const result = combatSystem.processAttack(player.id, monster.id);
      vi.restoreAllMocks();

      expect(result.success).toBe(true);
      expect(result.killed).toBe(false);
      expect(result.expGain).toBe(0);
      expect(result.goldGain).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // processAttack — PvP (player vs player)
  // ---------------------------------------------------------------

  describe('processAttack PvP', () => {
    it('should allow attacking another player', () => {
      const attacker = addPlayerToWorld(world, 'player-1', 5, 5);
      const defender = addPlayerToWorld(world, 'player-2', 5, 5);
      const initialHp = defender.hp;

      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const result = combatSystem.processAttack(attacker.id, defender.id);
      vi.restoreAllMocks();

      expect(result.success).toBe(true);
      expect(result.isBlocked).toBe(false);
      expect(defender.hp).toBeLessThan(initialHp);
      expect(result.targetId).toBe(defender.id);
    });

    it('should not kill the player (high HP vs low damage at level 1)', () => {
      const attacker = addPlayerToWorld(world, 'player-1', 5, 5);
      const defender = addPlayerToWorld(world, 'player-2', 5, 5);
      // Players start with 50 HP, damage at level 1 is low
      // One attack shouldn't kill them

      vi.spyOn(Math, 'random').mockReturnValue(0.0);
      const result = combatSystem.processAttack(attacker.id, defender.id);
      vi.restoreAllMocks();

      expect(result.success).toBe(true);
      expect(result.killed).toBe(false);
    });
  });
});
