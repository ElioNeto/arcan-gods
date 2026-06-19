import type { CharacterClass, Direction, EntityType } from './enums.js';
import type { MonsterAIState } from './ai.js';

export interface IEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  mapId: string;
}

export interface IPlayer extends IEntity {
  type: 'player';
  name: string;
  class: CharacterClass;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stamina: number;
  maxStamina: number;
  experience: number;
  experienceToNext: number;
  direction: Direction;
  online: boolean;
}

export interface IMonster extends IEntity {
  type: 'monster';
  templateId: string;
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  aggroRange: number;
  currentState?: MonsterAIState;
}

export interface INPC extends IEntity {
  type: 'npc';
  name: string;
  title: string;
  dialogues: string[];
}

export interface IAccount {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICharacter {
  id: string;
  accountId: string;
  name: string;
  class: CharacterClass;
  level: number;
  strength: number;
  agility: number;
  energy: number;
  vitality: number;
  hp: number;
  mp: number;
  mapId: string;
  x: number;
  y: number;
  experience: number;
  gold: number;
}
