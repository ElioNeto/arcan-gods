import { v4 as uuid } from 'uuid';
import type { Waypoint } from '@arcan-gods/shared';
import type { MonsterAIState } from '@arcan-gods/shared';

export interface MonsterTemplate {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  damageMin: number;
  damageMax: number;
  defense: number;
  experienceReward: number;
  goldReward: number;
  aggroRange: number;
  attackRange: number;
  respawnTime: number; // ms
  /** Cooldown between monster attacks in ms (default 2000) */
  attackCooldown: number;
  /** Movement speed in tiles per second (default 3) */
  moveSpeed: number;
  /** Leash range multiplier = aggroRange * leashMultiplier (default 2) */
  leashMultiplier: number;
  /** Radius (in tiles) for idle patrol movement (default 3) */
  patrolRadius: number;
  /** How often to recalculate chase path in ms (default 500) */
  pathRecalcInterval: number;
}

export class Monster {
  public readonly id: string;
  public template: MonsterTemplate;
  public hp: number;
  public maxHp: number;
  public x: number;
  public y: number;
  public mapId: string;
  public spawnX: number;
  public spawnY: number;
  public alive: boolean;
  public respawnAt: number | null;

  // --- AI State ---
  public currentState: MonsterAIState = 'idle';
  public lastAttackTime: number = 0;
  /** The player the monster is currently aggro'd on */
  public aggroTargetId: string | null = null;
  /** Current A* path the monster is following */
  public aiMovePath: Waypoint[] = [];
  /** Current index in aiMovePath */
  public aiMoveIndex: number = 0;
  /** Fractional tile accumulator for sub-tick movement */
  public aiMoveRemainder: number = 0;
  /** Last time the path was recalculated (for path recalc interval) */
  public lastPathRecalcTime: number = 0;
  /** Last time a patrol was started */
  public lastPatrolTime: number = 0;

  constructor(template: MonsterTemplate, x: number, y: number, mapId: string) {
    this.id = uuid();
    this.template = template;
    this.hp = template.maxHp;
    this.maxHp = template.maxHp;
    this.x = x;
    this.y = y;
    this.mapId = mapId;
    this.spawnX = x;
    this.spawnY = y;
    this.alive = true;
    this.respawnAt = null;
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    const actualDamage = Math.max(1, amount - this.template.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    if (this.hp <= 0) {
      this.die();
    }
  }

  die(): void {
    this.alive = false;
    this.respawnAt = Date.now() + this.template.respawnTime;
  }

  respawn(): void {
    this.hp = this.maxHp;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.alive = true;
    this.respawnAt = null;
    this.resetAI();
  }

  /** Resets AI state to initial idle (called on respawn) */
  resetAI(): void {
    this.currentState = 'idle';
    this.lastAttackTime = 0;
    this.aggroTargetId = null;
    this.aiMovePath = [];
    this.aiMoveIndex = 0;
    this.aiMoveRemainder = 0;
    this.lastPathRecalcTime = 0;
    this.lastPatrolTime = 0;
  }

  isAlive(): boolean {
    return this.alive;
  }

  shouldRespawn(): boolean {
    return !this.alive && this.respawnAt !== null && Date.now() >= this.respawnAt;
  }

  toJSON() {
    return {
      id: this.id,
      type: 'monster' as const,
      templateId: this.template.id,
      name: this.template.name,
      level: this.template.level,
      hp: this.hp,
      maxHp: this.maxHp,
      x: this.x,
      y: this.y,
      mapId: this.mapId,
      alive: this.alive,
      aggroRange: this.template.aggroRange,
      currentState: this.currentState,
    };
  }
}
