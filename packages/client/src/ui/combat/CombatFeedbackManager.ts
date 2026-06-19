import { Container } from 'pixi.js';
import { DamageNumber } from './DamageNumber.js';
import { EntityHealthBar } from './EntityHealthBar.js';

export interface EntityDamagedPacket {
  targetId: string;
  damage: number;
  isCritical: boolean;
  targetHp: number;
  targetMaxHp: number;
  /** World X position of the target entity */
  x: number;
  /** World Y position of the target entity */
  y: number;
}

/**
 * CombatFeedbackManager — Manages damage numbers and entity health bars.
 *
 * - Creates floating damage numbers on ENTITY_DAMAGED
 * - Creates/updates small HP bars above entities
 * - Updates animations each frame
 * - Cleans up when entities are removed
 */
export class CombatFeedbackManager {
  private damageNumbers: DamageNumber[] = [];
  private healthBars: Map<string, EntityHealthBar> = new Map();
  private feedbackContainer: Container;
  private healthBarContainer: Container;

  constructor(worldContainer: Container) {
    // Separate containers so we can control layering if needed
    this.feedbackContainer = new Container();
    this.healthBarContainer = new Container();

    worldContainer.addChild(this.feedbackContainer);
    worldContainer.addChild(this.healthBarContainer);
  }

  /**
   * Handle an ENTITY_DAMAGED packet:
   * - Spawn a floating damage number at the entity's position
   * - Create or update the entity's health bar
   */
  onEntityDamaged(packet: EntityDamagedPacket): void {
    // Create floating damage number
    const dn = new DamageNumber(
      packet.x,
      packet.y,
      packet.damage,
      packet.isCritical,
      this.feedbackContainer,
    );
    this.damageNumbers.push(dn);

    // Create or update health bar
    let healthBar = this.healthBars.get(packet.targetId);
    if (!healthBar) {
      healthBar = new EntityHealthBar(
        packet.targetId,
        packet.targetHp,
        packet.targetMaxHp,
        this.healthBarContainer,
      );
      this.healthBars.set(packet.targetId, healthBar);
    } else {
      healthBar.update(packet.targetHp, packet.targetMaxHp);
    }
    healthBar.setPosition(packet.x, packet.y);
  }

  /**
   * Called each frame. Advances all damage number animations
   * and removes any that have completed their lifetime.
   */
  update(deltaSec: number): void {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.update(deltaSec);
      if (dn.isDead()) {
        dn.destroy();
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  /**
   * Update the position of an entity's health bar.
   * Should be called each frame as entities move.
   */
  updateEntityPosition(entityId: string, x: number, y: number): void {
    const healthBar = this.healthBars.get(entityId);
    if (healthBar) {
      healthBar.setPosition(x, y);
    }
  }

  /**
   * Remove all feedback related to a removed entity.
   */
  removeEntity(entityId: string): void {
    const healthBar = this.healthBars.get(entityId);
    if (healthBar) {
      healthBar.destroy();
      this.healthBars.delete(entityId);
    }
  }

  /** Remove all damage numbers and health bars. */
  clear(): void {
    for (const dn of this.damageNumbers) {
      dn.destroy();
    }
    this.damageNumbers = [];

    for (const hb of this.healthBars.values()) {
      hb.destroy();
    }
    this.healthBars.clear();
  }
}
