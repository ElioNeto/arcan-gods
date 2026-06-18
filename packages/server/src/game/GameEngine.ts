import { World } from './World.js';
import { logger } from '../utils/logger.js';
import type { MovementSystem } from './systems/MovementSystem.js';

export class GameEngine {
  private world: World;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private tickRate: number;
  private running: boolean = false;
  private tickCount: number = 0;
  private movementSystem: MovementSystem | null = null;

  constructor(world: World, tickRate: number = 100) {
    this.world = world;
    this.tickRate = tickRate;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tickCount = 0;
    logger.info('Game engine starting', { tickRate: this.tickRate });
    this.tickInterval = setInterval(() => this.tick(), this.tickRate);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    logger.info('Game engine stopped', { totalTicks: this.tickCount });
  }

  getWorld(): World {
    return this.world;
  }

  isRunning(): boolean {
    return this.running;
  }

  getTickCount(): number {
    return this.tickCount;
  }

  setMovementSystem(ms: MovementSystem): void {
    this.movementSystem = ms;
  }

  getMovementSystem(): MovementSystem | null {
    return this.movementSystem;
  }

  private tick(): void {
    this.tickCount++;

    // Process monster respawns
    const monsters = this.world.getAllMonsters();
    for (const monster of monsters) {
      if (monster.shouldRespawn()) {
        monster.respawn();
        logger.debug('Monster respawned', { id: monster.id, name: monster.template.name });
      }
    }

    // Simple monster AI: patrol movement
    for (const monster of monsters) {
      if (!monster.isAlive()) continue;
      // Basic patrol - just stand still for now, AI will be expanded later
    }

    // Update movement system (continuous movement along paths)
    if (this.movementSystem) {
      this.movementSystem.update(this.tickRate);
    }
  }
}
