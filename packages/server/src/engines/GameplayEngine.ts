/**
 * Gameplay Engine — server implementation (#65)
 *
 * Wraps existing game systems (CombatSystem, MovementSystem, etc.)
 * behind the IGameplayEngine interface.
 *
 * Uses Strangler Fig pattern — existing systems continue to work,
 * new code goes through this engine.
 */

import type {
  IGameplayEngine, ICombatResult, ICombatConfig, ISkillConfig, IClassStats, IClassGrowth,
  IInventorySlot, IMoveResult,
} from '@arcan-gods/shared';
import type { CharacterClass } from '@arcan-gods/shared';
import { CLASS_BASE_STATS } from '@arcan-gods/shared';
import type { World } from '../game/World.js';
import type { CombatSystem } from '../game/systems/CombatSystem.js';
import type { MovementSystem } from '../game/systems/MovementSystem.js';
import type { CollisionSystem } from '../game/systems/CollisionSystem.js';

export class GameplayEngine implements IGameplayEngine {
  private combatSystem: CombatSystem | null = null;
  private movementSystem: MovementSystem | null = null;
  private collisionSystem: CollisionSystem | null = null;

  constructor(_world: World) {
    // World kept for future use (loot, inventory, etc.)
    void _world;
  }

  /** Inject dependencies */
  setCombatSystem(cs: CombatSystem): void { this.combatSystem = cs; }
  setMovementSystem(ms: MovementSystem): void { this.movementSystem = ms; }
  setCollisionSystem(cs: CollisionSystem): void { this.collisionSystem = cs; }

  // ─── Combat ─────────────────────────────────────────────────

  processAttack(attackerId: string, targetId: string): ICombatResult {
    if (!this.combatSystem) return { success: false, error: 'Combat system unavailable' };
    return this.combatSystem.processAttack(attackerId, targetId);
  }

  processMonsterAttack(monsterId: string, targetId: string): ICombatResult {
    if (!this.combatSystem) return { success: false, error: 'Combat system unavailable' };
    return this.combatSystem.processMonsterAttack(monsterId, targetId);
  }

  getCombatConfig(_entityId: string): ICombatConfig {
    return {
      baseDamageMin: 5,
      baseDamageMax: 15,
      attackSpeed: 1000,
      attackRange: 2,
      critChance: 0.05,
      critMultiplier: 2.0,
      blockChance: 0.05,
      defense: 2,
    };
  }

  // ─── Skills ─────────────────────────────────────────────────

  useSkill(_casterId: string, _skillId: string, _targetId?: string): ICombatResult {
    return { success: false, error: 'Skills not yet implemented' };
  }

  getSkillConfig(_skillId: string): ISkillConfig | undefined {
    return undefined;
  }

  isSkillOnCooldown(_entityId: string, _skillId: string): boolean {
    return false;
  }

  getAvailableSkills(_entityId: string): ISkillConfig[] {
    return [];
  }

  // ─── Classes ────────────────────────────────────────────────

  getClassBaseStats(className: CharacterClass): IClassStats {
    return CLASS_BASE_STATS[className] ?? { str: 10, agi: 10, ene: 10, vit: 10 };
  }

  getClassGrowth(_className: CharacterClass): IClassGrowth {
    return { strPerLevel: 2, agiPerLevel: 1.5, enePerLevel: 1.5, vitPerLevel: 1, hpPerLevel: 10, mpPerLevel: 5 };
  }

  calculateLevelUpStats(className: CharacterClass, _level: number): IClassStats {
    const growth = this.getClassGrowth(className);
    return {
      str: Math.floor(growth.strPerLevel),
      agi: Math.floor(growth.agiPerLevel),
      ene: Math.floor(growth.enePerLevel),
      vit: Math.floor(growth.vitPerLevel),
    };
  }

  // ─── Buffs ──────────────────────────────────────────────────

  applyBuff(_entityId: string, _buffId: string, _duration?: number): void {}
  removeBuff(_entityId: string, _buffId: string): void {}
  getActiveBuffs(_entityId: string): string[] { return []; }
  hasBuff(_entityId: string, _buffId: string): boolean { return false; }

  // ─── Loot ───────────────────────────────────────────────────

  generateLoot(_dropTableId: string, _level: number, _luck?: number): string[] {
    return [];
  }

  calculateGoldDrop(minGold: number, maxGold: number, _playerLevel: number): number {
    return Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;
  }

  // ─── Inventory ──────────────────────────────────────────────

  addItem(_characterId: string, _itemTemplateId: string, _quantity?: number): boolean {
    return false; // Not yet implemented
  }

  removeItem(_characterId: string, _position: number, _quantity?: number): boolean {
    return false;
  }

  moveItem(_characterId: string, _fromPosition: number, _toPosition: number): boolean {
    return false;
  }

  equipItem(_characterId: string, _position: number, _slot: string): boolean {
    return false;
  }

  getInventory(_characterId: string): IInventorySlot[] {
    return [];
  }

  // ─── NPC Shop ───────────────────────────────────────────────

  getBuyPrice(_itemTemplateId: string): number { return 0; }
  getSellPrice(_itemTemplateId: string): number { return 0; }

  buyItem(_characterId: string, _npcShopId: string, _itemTemplateId: string, _quantity?: number): boolean {
    return false;
  }

  sellItem(_characterId: string, _position: number): boolean {
    return false;
  }

  // ─── Movement ───────────────────────────────────────────────

  startMove(entityId: string, destX: number, destY: number, _mapId: string): IMoveResult {
    if (!this.movementSystem) {
      return { success: false, error: 'Movement system unavailable' };
    }
    // Delegate to MovementSystem
    return this.movementSystem.startPlayerMove(entityId, destX, destY);
  }

  stopMove(entityId: string): void {
    this.movementSystem?.stopPlayerMove(entityId);
  }

  isMoving(entityId: string): boolean {
    return this.movementSystem?.isMoving(entityId) ?? false;
  }

  updateMovement(deltaMs: number): void {
    this.movementSystem?.update(deltaMs);
  }

  // ─── Collision ──────────────────────────────────────────────

  canMoveTo(_mapId: string, _x: number, _y: number, _entityId?: string): boolean {
    return this.collisionSystem?.canMoveTo(_mapId, _x, _y) ?? true;
  }

  isInBounds(_mapId: string, _x: number, _y: number): boolean {
    if (!this.collisionSystem) return true;
    // CollisionSystem doesn't have isInBounds directly, but CollisionGrid does
    return true; // Fallback
  }

  // ─── Tick ───────────────────────────────────────────────────

  update(_deltaMs: number, _tickCount: number): ICombatResult[] {
    // Run AI, movement, etc.
    return [];
  }
}
