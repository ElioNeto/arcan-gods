import { World } from '../World.js';
import { MapManager } from '../tilemap/MapManager.js';
import { MonsterFSM, type FSMUpdateResult } from '../ai/MonsterFSM.js';
import { logger } from '../../utils/logger.js';

export interface MonsterAISystemOptions {
  /**
   * Number of groups to split monsters into for staggered processing.
   * Only 1/N of all monsters are processed per tick.
   * Default: 3
   */
  staggerGroups?: number;
}

/**
 * Orchestrates AI updates for all monsters in the world.
 *
 * - Processes monsters in staggered groups (default 1/3 per tick)
 *   to distribute CPU load across ticks.
 * - Monitors per-monster AI tick performance (logs if > 50ms).
 * - Returns FSMUpdateResult[] for the GameEngine to process attacks.
 */
export class MonsterAISystem {
  private readonly world: World;
  private readonly mapManager: MapManager;
  private readonly fsm: MonsterFSM;
  private readonly staggerGroups: number;

  constructor(
    world: World,
    mapManager: MapManager,
    options?: MonsterAISystemOptions,
  ) {
    this.world = world;
    this.mapManager = mapManager;
    this.fsm = new MonsterFSM();
    this.staggerGroups = options?.staggerGroups ?? 3;
  }

  /**
   * Processes a staggered subset of monsters for the current tick.
   *
   * @param deltaMs  - Time elapsed since last tick (ms)
   * @param tickCount - Current game tick counter (for stagger calculation)
   * @returns Array of FSM results (attack actions to be processed by CombatSystem)
   */
  update(deltaMs: number, tickCount: number): FSMUpdateResult[] {
    const monsters = this.world.getAllMonsters();
    if (monsters.length === 0) return [];

    // Stagger: select which group to process this tick
    const groupIndex = tickCount % this.staggerGroups;
    const groupSize = Math.ceil(monsters.length / this.staggerGroups);
    const start = groupIndex * groupSize;
    const end = Math.min(start + groupSize, monsters.length);

    const results: FSMUpdateResult[] = [];
    const now = Date.now();

    for (let i = start; i < end; i++) {
      const monster = monsters[i];
      if (!monster.isAlive()) continue;

      const playersInMap = this.world.getPlayersInMap(monster.mapId);
      const grid = this.mapManager.getGrid(monster.mapId);

      // Performance monitoring
      const startTime = Date.now();

      const result = this.fsm.update(monster, playersInMap, grid, deltaMs, now);

      const elapsed = Date.now() - startTime;
      if (elapsed > 50) {
        logger.warn('Monster AI tick took too long', {
          monsterId: monster.id,
          templateId: monster.template.id,
          elapsed: Math.round(elapsed),
        });
      }

      results.push(result);
    }

    return results;
  }

  /** Returns the number of stagger groups. */
  getStaggerGroups(): number {
    return this.staggerGroups;
  }
}
