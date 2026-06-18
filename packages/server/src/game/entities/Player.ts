import { v4 as uuid } from 'uuid';
import type { CharacterClass, Direction } from '@arcan-gods/shared';
import { GAME_CONSTANTS } from '@arcan-gods/shared';

export class Player {
  public readonly id: string;
  public name: string;
  public classType: CharacterClass;
  public level: number;
  public experience: number;
  public strength: number;
  public agility: number;
  public energy: number;
  public vitality: number;
  public hp: number;
  public maxHp: number;
  public mp: number;
  public maxMp: number;
  public mapId: string;
  public x: number;
  public y: number;
  public direction: Direction;
  public online: boolean;
  public socketId: string | null;

  constructor(name: string, classType: CharacterClass) {
    this.id = uuid();
    this.name = name;
    this.classType = classType;
    this.level = 1;
    this.experience = 0;
    this.strength = 10;
    this.agility = 10;
    this.energy = 10;
    this.vitality = 10;
    this.maxHp = GAME_CONSTANTS.BASE_HP;
    this.hp = this.maxHp;
    this.maxMp = GAME_CONSTANTS.BASE_MP;
    this.mp = this.maxMp;
    this.mapId = 'lorencia';
    this.x = 25;
    this.y = 20;
    this.direction = 'down';
    this.online = true;
    this.socketId = null;
  }

  get experienceToNext(): number {
    return Math.floor(GAME_CONSTANTS.XP_MULTIPLIER * Math.pow(this.level, 2.5));
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  addExperience(amount: number): boolean {
    this.experience += amount;
    let leveledUp = false;
    while (this.experience >= this.experienceToNext && this.level < GAME_CONSTANTS.MAX_LEVEL) {
      this.experience -= this.experienceToNext;
      this.levelUp();
      leveledUp = true;
    }
    if (this.level >= GAME_CONSTANTS.MAX_LEVEL) {
      this.experience = 0;
    }
    return leveledUp;
  }

  private levelUp(): void {
    this.level++;
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.maxMp += 5;
    this.mp = this.maxMp;
  }

  toJSON() {
    return {
      id: this.id,
      type: 'player' as const,
      name: this.name,
      class: this.classType,
      level: this.level,
      hp: this.hp,
      maxHp: this.maxHp,
      mp: this.mp,
      maxMp: this.maxMp,
      experience: this.experience,
      experienceToNext: this.experienceToNext,
      x: this.x,
      y: this.y,
      mapId: this.mapId,
      direction: this.direction,
      online: this.online,
    };
  }
}
