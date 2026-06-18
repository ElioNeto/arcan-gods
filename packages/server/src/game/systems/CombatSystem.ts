import { World } from '../World.js';
import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { calculateAttackDamage, calculateExperienceGain, calculateGoldDrop } from '@arcan-gods/shared';

export interface AttackResult {
  success: boolean;
  error?: string;
  damage?: number;
  isCritical?: boolean;
  isBlocked?: boolean;
  targetId?: string;
  targetHp?: number;
  targetMaxHp?: number;
  killed?: boolean;
  expGain?: number;
  goldGain?: number;
}

/**
 * Handles combat between entities: player attacks, damage calculation,
 * experience and gold rewards.
 */
export class CombatSystem {
  private lastAttackTime: Map<string, number> = new Map();
  private attackCooldown: number = 500; // ms between attacks

  constructor(private world: World) {}

  /**
   * Processa um ataque de jogador contra um alvo (monstro ou jogador).
   */
  processAttack(attackerId: string, targetId: string): AttackResult {
    const attacker = this.world.getPlayer(attackerId);
    const target = this.world.getMonster(targetId) || this.world.getPlayer(targetId);

    if (!attacker || !target) {
      return { success: false, error: 'Invalid attacker or target' };
    }

    if (!target.isAlive()) {
      return { success: false, error: 'Target is already dead' };
    }

    // Validate range (Manhattan distance)
    const dist = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
    if (dist > 2) {
      return { success: false, error: 'Target out of range' };
    }

    // Cooldown check
    const now = Date.now();
    const lastAttack = this.lastAttackTime.get(attackerId) || 0;
    if (now - lastAttack < this.attackCooldown) {
      return { success: false, error: 'Attack on cooldown' };
    }
    this.lastAttackTime.set(attackerId, now);

    // Determine if target is a Monster via duck typing
    const isMonster = 'template' in target;

    // Resolve defender stats
    const attackerLevel = attacker.level;
    const attackerStr = attacker.strength;
    const attackerAgi = attacker.agility;
    const defenderLevel = isMonster
      ? (target as Monster).template.level
      : (target as Player).level;
    // Monster.takeDamage already applies its own defense reduction,
    // so we pass 0 to avoid double-application against monsters.
    // Player defense not yet implemented — will derive from equipment.
    const defenderDefense = 0;

    // Calculate damage
    const damageResult = calculateAttackDamage({
      attackerLevel,
      attackerStr,
      attackerAgi,
      weaponDamage: 10, // base weapon damage until equipment is implemented
      defenderDefense,
      defenderLevel,
    });

    // Apply damage to target
    target.takeDamage(damageResult.damage);

    // Handle death
    let killed = false;
    let expGain = 0;
    let goldGain = 0;

    if (!target.isAlive()) {
      killed = true;
      if (isMonster) {
        const monster = target as Monster;
        expGain = calculateExperienceGain(
          attacker.level,
          monster.template.level,
          monster.template.experienceReward,
        );
        goldGain = calculateGoldDrop(monster.template.goldReward, attacker.level);
        attacker.addExperience(expGain);
        // TODO: add gold to player when gold system is implemented
      }
    }

    return {
      success: true,
      damage: damageResult.damage,
      isCritical: damageResult.isCritical,
      isBlocked: damageResult.isBlocked,
      targetId: target.id,
      targetHp: target.hp,
      targetMaxHp: target.maxHp,
      killed,
      expGain,
      goldGain,
    };
  }
}
