import { v4 as uuid } from 'uuid';

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
  public targetId: string | null;
  public patrolPhase: number;

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
    this.targetId = null;
    this.patrolPhase = 0;
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
    this.targetId = null;
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
    };
  }
}
