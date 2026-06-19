import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { World } from './game/World.js';
import { GameEngine } from './game/GameEngine.js';
import { Server } from './network/server.js';
import { Monster, type MonsterTemplate } from './game/entities/Monster.js';
import { MapManager } from './game/tilemap/MapManager.js';
import { CollisionSystem } from './game/systems/CollisionSystem.js';
import { MovementSystem } from './game/systems/MovementSystem.js';
import { CombatSystem } from './game/systems/CombatSystem.js';
import { MonsterAISystem } from './game/systems/MonsterAISystem.js';
import { runMigrations } from './db/migrate.js';
import { closePool } from './db/connection.js';
import { seed } from './db/seed/index.js';

const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    id: 'buddy_buddy',
    name: 'Buddy Buddy',
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
  },
  {
    id: 'spider',
    name: 'Spider',
    level: 3,
    hp: 80,
    maxHp: 80,
    damageMin: 8,
    damageMax: 15,
    defense: 3,
    experienceReward: 25,
    goldReward: 10,
    aggroRange: 5,
    attackRange: 1,
    respawnTime: 7000,
    attackCooldown: 2000,
    moveSpeed: 3,
    leashMultiplier: 2,
    patrolRadius: 3,
    pathRecalcInterval: 500,
  },
];

async function main(): Promise<void> {
  logger.info('Arcan Gods Server starting', { version: '0.1.0' });

  // Try to initialize database (fail gracefully for dev mode)
  try {
    await runMigrations();
    await seed();
    logger.info('Database initialized');
  } catch (err: any) {
    logger.warn('Database unavailable, running in dev mode', { error: err.message });
  }

  // Initialize world
  const world = new World();

  // Initialize map manager & collision system
  const mapManager = new MapManager();
  const collisionSystem = new CollisionSystem(mapManager, world);

  // Initialize movement system
  const movementSystem = new MovementSystem(world, mapManager, collisionSystem, { speed: 4 });
  world.setMovementSystem(movementSystem);

  // Initialize combat system
  const combatSystem = new CombatSystem(world);
  world.setCombatSystem(combatSystem);

  // Spawn test monsters in Lorencia
  MONSTER_TEMPLATES.forEach((template, index) => {
    for (let i = 0; i < 5; i++) {
      const x = 30 + (index * 5) + (i * 2);
      const y = 25 + (i * 2);
      const monster = new Monster(template, x, y, 'lorencia');
      world.addMonster(monster);
    }
  });

  logger.info('Monsters spawned', { count: MONSTER_TEMPLATES.length * 5 });

  // Initialize monster AI system
  const monsterAISystem = new MonsterAISystem(world, mapManager);
  world.setMonsterAISystem(monsterAISystem);

  // Initialize game engine
  const engine = new GameEngine(world, config.tickRate);
  engine.setMovementSystem(movementSystem);
  engine.setCombatSystem(combatSystem);
  engine.setMonsterAISystem(monsterAISystem);
  engine.start();

  // Initialize network server
  const server = new Server(world);
  engine.setServer(server);
  server.start();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info('Shutdown signal received', { signal });
    engine.stop();
    await server.stop();
    try { await closePool(); } catch {}
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Server initialization complete', {
    port: config.serverPort,
    tickRate: config.tickRate,
    env: config.nodeEnv,
  });
}

main().catch((err) => {
  logger.error('Fatal error', { error: err.message });
  process.exit(1);
});
