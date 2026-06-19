import { describe, it, expect, beforeEach } from 'vitest';
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
  respawnTime: 5000,
  attackCooldown: 2000,
  moveSpeed: 3,
  leashMultiplier: 2,
  patrolRadius: 3,
  pathRecalcInterval: 500,
};

describe('World', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe('Player Management', () => {
    it('should add and retrieve a player', () => {
      const player = new Player('TestPlayer', 'dark_knight');
      world.addPlayer(player);

      const retrieved = world.getPlayer(player.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('TestPlayer');
    });

    it('should remove a player', () => {
      const player = new Player('TestPlayer', 'dark_knight');
      world.addPlayer(player);
      world.removePlayer(player.id);

      const retrieved = world.getPlayer(player.id);
      expect(retrieved).toBeUndefined();
    });

    it('should find player by socket ID', () => {
      const player = new Player('TestPlayer', 'dark_knight');
      player.socketId = 'test-socket-123';
      world.addPlayer(player);

      const retrieved = world.getPlayerBySocket('test-socket-123');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(player.id);
    });

    it('should return undefined for unknown socket', () => {
      const retrieved = world.getPlayerBySocket('unknown-socket');
      expect(retrieved).toBeUndefined();
    });

    it('should get all players in a map', () => {
      const player1 = new Player('Player1', 'dark_knight');
      const player2 = new Player('Player2', 'dark_wizard');
      player2.mapId = 'devias';

      world.addPlayer(player1);
      world.addPlayer(player2);

      const lorenciaPlayers = world.getPlayersInMap('lorencia');
      expect(lorenciaPlayers).toHaveLength(1);
      expect(lorenciaPlayers[0].name).toBe('Player1');

      const deviasPlayers = world.getPlayersInMap('devias');
      expect(deviasPlayers).toHaveLength(1);
    });
  });

  describe('Monster Management', () => {
    it('should add and retrieve a monster', () => {
      const monster = new Monster(TEST_MONSTER_TEMPLATE, 100, 100, 'lorencia');
      world.addMonster(monster);

      const retrieved = world.getMonster(monster.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.template.name).toBe('Test Monster');
    });

    it('should get only alive monsters in a map', () => {
      const monster1 = new Monster(TEST_MONSTER_TEMPLATE, 100, 100, 'lorencia');
      const monster2 = new Monster(TEST_MONSTER_TEMPLATE, 200, 200, 'lorencia');
      monster2.takeDamage(999); // kill it

      world.addMonster(monster1);
      world.addMonster(monster2);

      const aliveMonsters = world.getMonstersInMap('lorencia');
      expect(aliveMonsters).toHaveLength(1);
    });
  });

  describe('World State', () => {
    it('should return world state for a map', () => {
      const player = new Player('TestPlayer', 'dark_knight');
      const monster = new Monster(TEST_MONSTER_TEMPLATE, 100, 100, 'lorencia');

      world.addPlayer(player);
      world.addMonster(monster);

    const state = world.getWorldStatePacket('lorencia');
    expect(state.type).toBe('WORLD_STATE');
    if (state.type === 'WORLD_STATE') {
      expect(state.mapId).toBe('lorencia');
      expect(state.entities).toHaveLength(2); // 1 player + 1 monster
    }
    });
  });
});
