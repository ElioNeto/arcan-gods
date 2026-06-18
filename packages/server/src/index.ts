import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { World } from './game/World.js';
import { GameEngine } from './game/GameEngine.js';
import { Server } from './network/server.js';
import { Monster, type MonsterTemplate } from './game/entities/Monster.js';

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
  },
];

function main(): void {
  logger.info('Arcan Gods Server starting', { version: '0.1.0' });

  // Initialize world
  const world = new World();

  // Spawn test monsters in Lorencia
  MONSTER_TEMPLATES.forEach((template, index) => {
    for (let i = 0; i < 5; i++) {
      const x = 110 + (index * 20) + (i * 3);
      const y = 100 + (i * 3);
      const monster = new Monster(template, x, y, 'lorencia');
      world.addMonster(monster);
    }
  });

  logger.info('Monsters spawned', { count: MONSTER_TEMPLATES.length * 5 });

  // Initialize game engine
  const engine = new GameEngine(world, config.tickRate);
  engine.start();

  // Initialize network server
  const server = new Server(world);
  server.start();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info('Shutdown signal received', { signal });
    engine.stop();
    await server.stop();
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

main();
