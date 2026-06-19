/**
 * Gameplay Engine Interface (#65)
 *
 * Defines the contract for all game mechanics: combat, skills, classes,
 * buffs/debuffs, loot, inventory, movement, collision, and NPC shops.
 *
 * Implementations: server/src/engines/GameplayEngine.ts
 * This interface is pure — NO runtime dependencies beyond shared types.
 */

import type { Waypoint } from '../types/movement.js';
import type { CharacterClass } from '../types/enums.js';

// ─── Combat ───────────────────────────────────────────────────────

export interface ICombatResult {
  success: boolean;
  damage?: number;
  isCritical?: boolean;
  isBlocked?: boolean;
  targetId?: string;
  targetHp?: number;
  targetMaxHp?: number;
  killed?: boolean;
  attackerId?: string;
  expGain?: number;
  goldGain?: number;
  error?: string;
}

export interface ICombatConfig {
  baseDamageMin: number;
  baseDamageMax: number;
  attackSpeed: number; // ms between attacks
  attackRange: number; // tiles
  critChance: number; // 0.0 – 1.0
  critMultiplier: number;
  blockChance: number;
  defense: number;
}

// ─── Skills ───────────────────────────────────────────────────────

export type SkillTargetType = 'enemy' | 'self' | 'ally' | 'area';

export interface ISkillConfig {
  id: string;
  name: string;
  class: CharacterClass;
  levelRequired: number;
  manaCost: number;
  cooldown: number; // ms
  range: number; // tiles
  targetType: SkillTargetType;
  damageMultiplier: number; // % of attack damage
  areaOfEffect?: number; // radius in tiles, 0 = single target
  animationKey: string;
  description: string;
}

// ─── Classes ──────────────────────────────────────────────────────

export interface IClassStats {
  str: number;
  agi: number;
  ene: number;
  vit: number;
}

export interface IClassGrowth {
  strPerLevel: number;
  agiPerLevel: number;
  enePerLevel: number;
  vitPerLevel: number;
  hpPerLevel: number;
  mpPerLevel: number;
}

// ─── Buffs / Debuffs ──────────────────────────────────────────────

export type BuffType = 'buff' | 'debuff' | 'dot' | 'hot';

export interface IBuffConfig {
  id: string;
  name: string;
  type: BuffType;
  duration: number; // ms
  statModifiers?: Partial<IClassStats>;
  damagePerTick?: number;
  healPerTick?: number;
  tickInterval?: number; // ms
  maxStacks: number;
  iconKey: string;
}

// ─── Loot & Inventory ─────────────────────────────────────────────

export interface IDropEntry {
  itemTemplateId: string;
  chance: number; // 0.0 – 1.0
  minQuantity: number;
  maxQuantity: number;
  minLevel?: number;
  maxLevel?: number;
}

export interface IDropTable {
  entries: IDropEntry[];
  minGold: number;
  maxGold: number;
  guaranteedDrop?: boolean; // at least 1 item drops
}

export interface IInventorySlot {
  position: number; // 0-39 (8x5 grid)
  itemTemplateId: string | null;
  quantity: number;
}

export interface IItemStats {
  damageMin?: number;
  damageMax?: number;
  defense?: number;
  str?: number;
  agi?: number;
  ene?: number;
  vit?: number;
  hp?: number;
  mp?: number;
}

export interface IItemTemplate {
  id: string;
  name: string;
  category: string; // 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'necklace' | 'consumable' | 'etc'
  tier: number; // 0=Normal, 1=Magic, 2=Rare, 3=Unique, 4=Legend
  level: number;
  stats: IItemStats;
  sellPrice: number;
  maxUpgrade: number; // max +X upgrade level
}

// ─── Movement ─────────────────────────────────────────────────────

export interface IMoveResult {
  success: boolean;
  path?: Waypoint[];
  error?: string;
}

// ─── Engine Interface ─────────────────────────────────────────────

export interface IGameplayEngine {
  // Combat
  processAttack(attackerId: string, targetId: string): ICombatResult;
  processMonsterAttack(monsterId: string, targetId: string): ICombatResult;
  getCombatConfig(entityId: string): ICombatConfig;

  // Skills
  useSkill(casterId: string, skillId: string, targetId?: string): ICombatResult;
  getSkillConfig(skillId: string): ISkillConfig | undefined;
  isSkillOnCooldown(entityId: string, skillId: string): boolean;
  getAvailableSkills(entityId: string): ISkillConfig[];

  // Classes
  getClassBaseStats(className: CharacterClass): IClassStats;
  getClassGrowth(className: CharacterClass): IClassGrowth;
  calculateLevelUpStats(className: CharacterClass, level: number): IClassStats;

  // Buffs
  applyBuff(entityId: string, buffId: string, duration?: number): void;
  removeBuff(entityId: string, buffId: string): void;
  getActiveBuffs(entityId: string): string[];
  hasBuff(entityId: string, buffId: string): boolean;

  // Loot
  generateLoot(dropTableId: string, level: number, luck?: number): string[];
  calculateGoldDrop(minGold: number, maxGold: number, playerLevel: number): number;

  // Inventory
  addItem(characterId: string, itemTemplateId: string, quantity?: number): boolean;
  removeItem(characterId: string, position: number, quantity?: number): boolean;
  moveItem(characterId: string, fromPosition: number, toPosition: number): boolean;
  equipItem(characterId: string, position: number, slot: string): boolean;
  getInventory(characterId: string): IInventorySlot[];

  // NPC Shop
  getBuyPrice(itemTemplateId: string): number;
  getSellPrice(itemTemplateId: string): number;
  buyItem(characterId: string, npcShopId: string, itemTemplateId: string, quantity?: number): boolean;
  sellItem(characterId: string, position: number): boolean;

  // Movement
  startMove(entityId: string, destX: number, destY: number, mapId: string): IMoveResult;
  stopMove(entityId: string): void;
  isMoving(entityId: string): boolean;
  updateMovement(deltaMs: number): void;

  // Collision
  canMoveTo(mapId: string, x: number, y: number, entityId?: string): boolean;
  isInBounds(mapId: string, x: number, y: number): boolean;

  // Tick (called by GameEngine)
  update(deltaMs: number, tickCount: number): ICombatResult[];
}
