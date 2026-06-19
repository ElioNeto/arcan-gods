import { describe, it, expect, vi } from 'vitest';
import { Monster, type MonsterTemplate } from '../Monster.js';

const TEST_TEMPLATE: MonsterTemplate = {
  id: 'test_buddy',
  name: 'Test Buddy',
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

describe('Monster', () => {
  it('should create a monster from template', () => {
    const monster = new Monster(TEST_TEMPLATE, 100, 100, 'lorencia');

    expect(monster.template.name).toBe('Test Buddy');
    expect(monster.hp).toBe(50);
    expect(monster.maxHp).toBe(50);
    expect(monster.x).toBe(100);
    expect(monster.y).toBe(100);
    expect(monster.alive).toBe(true);
  });

  it('should take damage with defense reduction', () => {
    const monster = new Monster(TEST_TEMPLATE, 100, 100, 'lorencia');
    monster.takeDamage(10);
    // 10 - 2 defense = 8 damage
    expect(monster.hp).toBe(42);
  });

  it('should always deal at least 1 damage', () => {
    const monster = new Monster(TEST_TEMPLATE, 100, 100, 'lorencia');
    monster.takeDamage(1);
    expect(monster.hp).toBe(49); // min 1 damage
  });

  it('should die when HP reaches 0', () => {
    const monster = new Monster(TEST_TEMPLATE, 100, 100, 'lorencia');
    monster.takeDamage(999);
    expect(monster.alive).toBe(false);
    expect(monster.respawnAt).not.toBeNull();
  });

  it('should respawn after timer', () => {
    const monster = new Monster(TEST_TEMPLATE, 100, 100, 'lorencia');
    monster.takeDamage(999);
    expect(monster.shouldRespawn()).toBe(false); // not yet

    // Simulate time passing
    const futureTime = Date.now() + 6000;
    vi.spyOn(Date, 'now').mockReturnValue(futureTime);
    expect(monster.shouldRespawn()).toBe(true);

    monster.respawn();
    expect(monster.alive).toBe(true);
    expect(monster.hp).toBe(50);
    expect(monster.x).toBe(100);
    expect(monster.y).toBe(100);
  });

  it('should not take damage when dead', () => {
    const monster = new Monster(TEST_TEMPLATE, 100, 100, 'lorencia');
    monster.takeDamage(999);
    const hpBefore = monster.hp;
    monster.takeDamage(10);
    expect(monster.hp).toBe(hpBefore);
  });

  it('should serialize to JSON', () => {
    const monster = new Monster(TEST_TEMPLATE, 100, 100, 'lorencia');
    const json = monster.toJSON();

    expect(json.id).toBe(monster.id);
    expect(json.name).toBe('Test Buddy');
    expect(json.type).toBe('monster');
    expect(json.alive).toBe(true);
  });
});
