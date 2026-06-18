import { describe, it, expect } from 'vitest';
import {
  calculatePhysicalDamage,
  calculateDefenseReduction,
  calculateHitRate,
  calculateCritical,
  calculateAttackDamage,
  calculateExperienceGain,
  calculateGoldDrop,
} from '../constants/damage-formulas.js';

describe('calculatePhysicalDamage', () => {
  it('should return at least 1 damage', () => {
    const dmg = calculatePhysicalDamage(1, 1, 0);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });

  it('should increase damage with higher STR', () => {
    const lowStr = calculatePhysicalDamage(1, 10, 5);
    const highStr = calculatePhysicalDamage(1, 100, 5);
    expect(highStr).toBeGreaterThanOrEqual(lowStr);
  });

  it('should increase damage with higher level', () => {
    const lowLvl = calculatePhysicalDamage(1, 10, 5);
    const highLvl = calculatePhysicalDamage(50, 10, 5);
    expect(highLvl).toBeGreaterThanOrEqual(lowLvl);
  });

  it('should scale with weapon damage variance', () => {
    // weaponDamage = 0 means no variance added
    // higher weaponDamage adds more possible damage
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      results.add(calculatePhysicalDamage(1, 10, 20));
    }
    // With 20 variance there should be at least 2 different values
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('calculateDefenseReduction', () => {
  it('should reduce damage by defense/2', () => {
    const result = calculateDefenseReduction(100, 10);
    // reduction = floor(10/2) = 5, so 100-5 = 95
    expect(result).toBe(95);
  });

  it('should return at least 1 damage', () => {
    const result = calculateDefenseReduction(3, 100);
    // reduction = floor(100/2) = 50, so max(1, 3-50) = 1
    expect(result).toBe(1);
  });

  it('should not reduce damage when defense is 0', () => {
    const result = calculateDefenseReduction(50, 0);
    expect(result).toBe(50);
  });
});

describe('calculateHitRate', () => {
  it('should always return a value (hit or miss)', () => {
    for (let i = 0; i < 100; i++) {
      const result = calculateHitRate(20, 1, 1);
      // result is boolean, test is it doesn't throw
      expect(typeof result).toBe('boolean');
    }
  });

  it('should have higher hit chance with high AGI', () => {
    let hitsHighAgi = 0;
    let hitsLowAgi = 0;
    const trials = 500;

    for (let i = 0; i < trials; i++) {
      if (calculateHitRate(100, 1, 1)) hitsHighAgi++;
      if (calculateHitRate(1, 1, 1)) hitsLowAgi++;
    }

    // High AGI should hit more often
    expect(hitsHighAgi).toBeGreaterThan(hitsLowAgi);
  });

  it('should clamp between 20% and 95%', () => {
    // Very low AGI vs high level defender -> minimum 20%
    let minRate = 0;
    // Very high AGI vs low level defender -> maximum 95%
    let maxRate = 0;
    const trials = 500;

    for (let i = 0; i < trials; i++) {
      if (calculateHitRate(1, 1, 100)) minRate++;
      if (calculateHitRate(100, 100, 1)) maxRate++;
    }

    expect(minRate / trials).toBeLessThan(0.3);
    expect(maxRate / trials).toBeGreaterThan(0.85);
  });
});

describe('calculateCritical', () => {
  it('should return isCritical as boolean', () => {
    for (let i = 0; i < 50; i++) {
      const result = calculateCritical(20);
      expect(typeof result.isCritical).toBe('boolean');
      expect(result.multiplier).toBe(result.isCritical ? 1.5 : 1);
    }
  });

  it('should have higher crit chance with higher AGI', () => {
    let critsLow = 0;
    let critsHigh = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      if (calculateCritical(10).isCritical) critsLow++;
      if (calculateCritical(65).isCritical) critsHigh++;
    }

    // 10 AGI = 15% chance, 65 AGI = 42% chance
    expect(critsHigh).toBeGreaterThan(critsLow);
  });

  it('should have at least 10% base chance with 0 AGI', () => {
    let crits = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      if (calculateCritical(0).isCritical) crits++;
    }

    // Should be around 10%
    expect(crits / trials).toBeGreaterThan(0.05);
  });
});

describe('calculateAttackDamage', () => {
  it('should return a DamageResult with valid values', () => {
    const result = calculateAttackDamage({
      attackerLevel: 1,
      attackerStr: 28,
      attackerAgi: 20,
      weaponDamage: 10,
      defenderDefense: 2,
      defenderLevel: 1,
    });

    expect(result).toHaveProperty('damage');
    expect(result).toHaveProperty('isCritical');
    expect(result).toHaveProperty('isBlocked');
    expect(result).toHaveProperty('damageType');
  });

  it('should have damageType physical', () => {
    const result = calculateAttackDamage({
      attackerLevel: 1,
      attackerStr: 28,
      attackerAgi: 20,
      weaponDamage: 10,
      defenderDefense: 2,
      defenderLevel: 1,
    });

    expect(result.damageType).toBe('physical');
  });

  it('should have isBlocked true when attack misses', () => {
    // Force a miss: minimum AGI vs high level defender
    let blockedCount = 0;
    const trials = 200;

    for (let i = 0; i < trials; i++) {
      const result = calculateAttackDamage({
        attackerLevel: 1,
        attackerStr: 10,
        attackerAgi: 1,
        weaponDamage: 5,
        defenderDefense: 0,
        defenderLevel: 50,
      });
      if (result.isBlocked) blockedCount++;
    }

    // Should have some misses
    expect(blockedCount).toBeGreaterThan(0);
  });

  it('should apply critical multiplier when critical happens', () => {
    let sawCritical = false;
    const trials = 500;

    for (let i = 0; i < trials; i++) {
      const result = calculateAttackDamage({
        attackerLevel: 50,
        attackerStr: 200,
        attackerAgi: 65,
        weaponDamage: 50,
        defenderDefense: 10,
        defenderLevel: 1,
      });
      if (result.isCritical) {
        sawCritical = true;
        break;
      }
    }

    expect(sawCritical).toBe(true);
  });

  it('should return damage >= 0 (0 for miss, >=1 for hit)', () => {
    const result = calculateAttackDamage({
      attackerLevel: 1,
      attackerStr: 28,
      attackerAgi: 20,
      weaponDamage: 10,
      defenderDefense: 2,
      defenderLevel: 1,
    });

    expect(result.damage).toBeGreaterThanOrEqual(0);
    if (!result.isBlocked) {
      expect(result.damage).toBeGreaterThanOrEqual(1);
    } else {
      expect(result.damage).toBe(0);
    }
  });
});

describe('calculateExperienceGain', () => {
  it('should return baseExp when levels are equal', () => {
    expect(calculateExperienceGain(10, 10, 100)).toBe(100);
  });

  it('should apply 1.5x multiplier when monster is 5+ levels higher', () => {
    expect(calculateExperienceGain(10, 15, 100)).toBe(150);
    expect(calculateExperienceGain(10, 20, 100)).toBe(150);
  });

  it('should apply 1.2x multiplier when monster is 2-4 levels higher', () => {
    expect(calculateExperienceGain(10, 12, 100)).toBe(120);
    expect(calculateExperienceGain(10, 14, 100)).toBe(120);
  });

  it('should apply 0.8x multiplier when player is 2-4 levels higher', () => {
    expect(calculateExperienceGain(12, 10, 100)).toBe(80);
    expect(calculateExperienceGain(14, 10, 100)).toBe(80);
  });

  it('should apply 0.5x multiplier when player is 5+ levels higher', () => {
    expect(calculateExperienceGain(15, 10, 100)).toBe(50);
    expect(calculateExperienceGain(20, 10, 100)).toBe(50);
  });

  it('should return 0 when baseExp is 0', () => {
    expect(calculateExperienceGain(10, 10, 0)).toBe(0);
  });
});

describe('calculateGoldDrop', () => {
  it('should return baseGold when player is level 1', () => {
    const gold = calculateGoldDrop(100, 1);
    // floor(100 * (1 + 1 * 0.1)) = floor(110) = 110
    expect(gold).toBe(110);
  });

  it('should scale with player level', () => {
    const low = calculateGoldDrop(100, 1);
    const high = calculateGoldDrop(100, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('should return 0 when baseGold is 0', () => {
    expect(calculateGoldDrop(0, 10)).toBe(0);
  });

  it('should increase by 10% per level', () => {
    const level10 = calculateGoldDrop(100, 10);
    // floor(100 * (1 + 10 * 0.1)) = floor(200) = 200
    expect(level10).toBe(200);
  });
});
