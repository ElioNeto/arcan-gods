import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from '../GameEngine.js';
import { World } from '../World.js';
import { Player } from '../entities/Player.js';
import { Monster, type MonsterTemplate } from '../entities/Monster.js';

const TEST_MONSTER_TEMPLATE: MonsterTemplate = {
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
  respawnTime: 50, // short for testing
  attackCooldown: 2000,
  moveSpeed: 3,
  leashMultiplier: 2,
  patrolRadius: 3,
  pathRecalcInterval: 500,
};

describe('GameEngine', () => {
  let world: World;
  let engine: GameEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    world = new World();
    engine = new GameEngine(world, 100);
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  it('should start and stop', () => {
    expect(engine.isRunning()).toBe(false);
    engine.start();
    expect(engine.isRunning()).toBe(true);
    engine.stop();
    expect(engine.isRunning()).toBe(false);
  });

  it('should increment tick count', () => {
    engine.start();
    vi.advanceTimersByTime(500);
    expect(engine.getTickCount()).toBeGreaterThanOrEqual(4);
    engine.stop();
  });

  it('should respawn dead monsters after timer expires', () => {
    const startTime = Date.now();
    const monster = new Monster(TEST_MONSTER_TEMPLATE, 100, 100, 'lorencia');
    monster.takeDamage(999); // kill it
    expect(monster.isAlive()).toBe(false);
    expect(monster.shouldRespawn()).toBe(false); // not yet

    // Manually set respawnAt to be in the past to test respawn logic
    (monster as any).respawnAt = startTime - 1;
    expect(monster.shouldRespawn()).toBe(true);
  });

  it('should return world reference', () => {
    expect(engine.getWorld()).toBe(world);
  });

  it('should not double-start', () => {
    engine.start();
    const tickCount = engine.getTickCount();
    engine.start(); // should be no-op
    expect(engine.getTickCount()).toBe(tickCount);
    engine.stop();
  });

  describe('Stamina', () => {
    it('should regenerate stamina when player is not moving', () => {
      const player = new Player('Test', 'dark_knight');
      player.stamina = 80;
      world.addPlayer(player);

      engine.start();
      vi.advanceTimersByTime(100); // 1 tick

      expect(player.stamina).toBe(81);
      engine.stop();
    });

    it('should regenerate stamina over multiple ticks', () => {
      const player = new Player('Test', 'dark_knight');
      player.stamina = 80;
      world.addPlayer(player);

      engine.start();
      vi.advanceTimersByTime(300); // 3 ticks

      expect(player.stamina).toBe(83);
      engine.stop();
    });

    it('should not exceed max stamina', () => {
      const player = new Player('Test', 'dark_knight');
      player.stamina = 99;
      world.addPlayer(player);

      engine.start();
      vi.advanceTimersByTime(500); // 5 ticks, would be 104 but capped at 100

      expect(player.stamina).toBe(100);
      engine.stop();
    });

    it('should not regenerate stamina when stamina is already at max', () => {
      const player = new Player('Test', 'dark_knight');
      player.stamina = 100;
      world.addPlayer(player);

      engine.start();
      vi.advanceTimersByTime(200); // 2 ticks

      expect(player.stamina).toBe(100);
      engine.stop();
    });
  });
});
