import { World } from './World.js';
import { logger } from '../utils/logger.js';
import type { MovementSystem } from './systems/MovementSystem.js';
import type { CombatSystem } from './systems/CombatSystem.js';
import type { MonsterAISystem } from './systems/MonsterAISystem.js';
import type { Server } from '../network/server.js';
import { GAME_CONSTANTS } from '@arcan-gods/shared';

export class GameEngine {
  private world: World;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private tickRate: number;
  private running: boolean = false;
  private tickCount: number = 0;
  private movementSystem: MovementSystem | null = null;
  private combatSystem: CombatSystem | null = null;
  private monsterAISystem: MonsterAISystem | null = null;
  private server: Server | null = null;

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

  setCombatSystem(cs: CombatSystem): void {
    this.combatSystem = cs;
  }

  getCombatSystem(): CombatSystem | null {
    return this.combatSystem;
  }

  setMonsterAISystem(mas: MonsterAISystem): void {
    this.monsterAISystem = mas;
  }

  getMonsterAISystem(): MonsterAISystem | null {
    return this.monsterAISystem;
  }

  setServer(server: Server): void {
    this.server = server;
  }

  getServer(): Server | null {
    return this.server;
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

    // Update monster AI (staggered processing)
    if (this.monsterAISystem) {
      const results = this.monsterAISystem.update(this.tickRate, this.tickCount);

      // Process attack results
      for (const result of results) {
        if (!result.attacked || !result.targetId || !this.combatSystem || !this.server) continue;

        const attackResult = this.combatSystem.processMonsterAttack(
          result.monsterId,
          result.targetId,
        );

        if (attackResult.success) {
          // Update monster's attack cooldown
          const monster = this.world.getMonster(result.monsterId);

          // Broadcast ENTITY_DAMAGED to all players in the same map
          if (monster) {
            monster.lastAttackTime = Date.now();
            this.server.broadcastToMap(monster.mapId, {
              type: 'ENTITY_DAMAGED',
              attackerId: result.monsterId,
              targetId: result.targetId,
              damage: attackResult.damage ?? 0,
              isCritical: attackResult.isCritical ?? false,
              isBlocked: attackResult.isBlocked ?? false,
              targetHp: attackResult.targetHp ?? 0,
              targetMaxHp: attackResult.targetMaxHp ?? 0,
              killed: attackResult.killed ?? false,
            });
          }
        }
      }
    }

    // Regenerate stamina when player is not moving (P1.2)
    const players = this.world.getAllPlayers();
    const updatedPlayers: string[] = [];
    for (const player of players) {
      if (player.stamina < player.maxStamina) {
        const before = player.stamina;
        // Only regen if player is NOT actively moving
        if (!this.movementSystem?.isMoving(player.id)) {
          player.regenStamina(GAME_CONSTANTS.STAMINA_REGEN_PER_TICK);
          if (player.stamina !== before) {
            updatedPlayers.push(player.id);
          }
        }
      }
    }

    // Update movement system (continuous movement along paths)
    if (this.movementSystem) {
      this.movementSystem.update(this.tickRate);
      // Track players that moved (position changes)
      for (const player of players) {
        if (this.movementSystem.isMoving(player.id) && !updatedPlayers.includes(player.id)) {
          updatedPlayers.push(player.id);
        }
      }
    }

    // Broadcast ENTITY_UPDATE for changed players (#62 fix)
    if (this.server && updatedPlayers.length > 0) {
      for (const playerId of updatedPlayers) {
        const player = this.world.getPlayer(playerId);
        if (player && player.online) {
          this.server.broadcastToMap(player.mapId, {
            type: 'ENTITY_UPDATE',
            entity: {
              id: player.id,
              type: 'player' as const,
              x: player.x,
              y: player.y,
              hp: player.hp,
              maxHp: player.maxHp,
              stamina: player.stamina,
              maxStamina: player.maxStamina,
              direction: player.direction,
            },
          } as any);
        }
      }
    }
  }
}
