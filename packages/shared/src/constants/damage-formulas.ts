export interface DamageResult {
  damage: number;
  isCritical: boolean;
  isBlocked: boolean;
  damageType: 'physical' | 'magical';
}

/**
 * Calcula dano físico baseado em STR.
 * Fórmula: (STR * 2) + (level * 1.5) + random(0, weaponDamage)
 */
export function calculatePhysicalDamage(
  attackerLevel: number,
  attackerStr: number,
  weaponDamage: number,
): number {
  const base = Math.floor(attackerStr * 2 + attackerLevel * 1.5);
  const variance = Math.floor(Math.random() * (weaponDamage + 1));
  return Math.max(1, base + variance);
}

/**
 * Calcula dano mágico baseado em ENE.
 * Fórmula: (ENE * 2.5) + (level * 2) + random(0, skillDamage)
 */
export function calculateMagicalDamage(
  attackerLevel: number,
  attackerEne: number,
  skillDamage: number,
): number {
  const base = Math.floor(attackerEne * 2.5 + attackerLevel * 2);
  const variance = Math.floor(Math.random() * (skillDamage + 1));
  return Math.max(1, base + variance);
}

/**
 * Calcula defesa reduzindo dano.
 * Fórmula: defesa / 2 (cada 2 pontos de defesa reduzem 1 de dano)
 */
export function calculateDefenseReduction(
  rawDamage: number,
  defenderDefense: number,
): number {
  const reduction = Math.floor(defenderDefense / 2);
  return Math.max(1, rawDamage - reduction);
}

/**
 * Calcula taxa de acerto baseado em AGI do atacante vs level do defensor.
 */
export function calculateHitRate(
  attackerAgi: number,
  attackerLevel: number,
  defenderLevel: number,
): boolean {
  const rate = 50 + (attackerAgi * 2) + (attackerLevel - defenderLevel) * 3;
  return Math.random() * 100 < Math.min(95, Math.max(20, rate));
}

/**
 * Calcula dano crítico (10% chance base + 0.5% por ponto de AGI).
 * Dano crítico = dano * 1.5
 */
export function calculateCritical(
  attackerAgi: number,
): { isCritical: boolean; multiplier: number } {
  const chance = 10 + Math.floor(attackerAgi * 0.5);
  const isCritical = Math.random() * 100 < chance;
  return { isCritical, multiplier: isCritical ? 1.5 : 1 };
}

/**
 * Calcula dano completo de um ataque físico.
 */
export function calculateAttackDamage(params: {
  attackerLevel: number;
  attackerStr: number;
  attackerAgi: number;
  weaponDamage: number;
  defenderDefense: number;
  defenderLevel: number;
}): DamageResult {
  const { isCritical, multiplier } = calculateCritical(params.attackerAgi);
  const hit = calculateHitRate(params.attackerAgi, params.attackerLevel, params.defenderLevel);

  if (!hit) {
    return { damage: 0, isCritical: false, isBlocked: true, damageType: 'physical' };
  }

  let raw = calculatePhysicalDamage(params.attackerLevel, params.attackerStr, params.weaponDamage);
  raw = Math.floor(raw * multiplier);
  const final = calculateDefenseReduction(raw, params.defenderDefense);

  return {
    damage: final,
    isCritical,
    isBlocked: false,
    damageType: 'physical',
  };
}

/**
 * Calcula dano de magia (ignora defesa parcialmente).
 */
export function calculateMagicDamage(params: {
  attackerLevel: number;
  attackerEne: number;
  skillDamage: number;
  defenderLevel: number;
}): DamageResult {
  const raw = calculateMagicalDamage(params.attackerLevel, params.attackerEne, params.skillDamage);
  return {
    damage: Math.max(1, raw),
    isCritical: false,
    isBlocked: false,
    damageType: 'magical',
  };
}

/** EXP ganho ao matar monstro baseado na diferença de nível */
export function calculateExperienceGain(
  playerLevel: number,
  monsterLevel: number,
  baseExp: number,
): number {
  const diff = monsterLevel - playerLevel;
  let multiplier = 1;
  if (diff >= 5) multiplier = 1.5;
  else if (diff >= 2) multiplier = 1.2;
  else if (diff <= -5) multiplier = 0.5;
  else if (diff <= -2) multiplier = 0.8;
  return Math.floor(baseExp * multiplier);
}

/** Gold ganho ao matar monstro */
export function calculateGoldDrop(
  baseGold: number,
  playerLevel: number,
): number {
  return Math.floor(baseGold * (1 + playerLevel * 0.1));
}
