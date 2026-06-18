import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  xpForLevel,
  validateEmail,
  validateCharacterName,
} from '../utils/helpers.js';
import { GAME_CONSTANTS } from '../constants/game.js';

describe('calculateLevel', () => {
  it('should return level 1 for zero XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('should return level 1 for negative XP', () => {
    expect(calculateLevel(-100)).toBe(1);
  });

  it('should return correct level for XP exactly at threshold', () => {
    // XP for level 2
    const xpForLevel2 = Math.floor(GAME_CONSTANTS.XP_MULTIPLIER * Math.pow(2, 2.5));
    expect(calculateLevel(xpForLevel2)).toBe(2);
  });

  it('should return level 400 for max XP', () => {
    const maxXp = Math.floor(GAME_CONSTANTS.XP_MULTIPLIER * Math.pow(GAME_CONSTANTS.MAX_LEVEL, 2.5));
    expect(calculateLevel(maxXp)).toBe(GAME_CONSTANTS.MAX_LEVEL);
  });

  it('should not exceed MAX_LEVEL', () => {
    const hugeXp = 999999999;
    expect(calculateLevel(hugeXp)).toBe(GAME_CONSTANTS.MAX_LEVEL);
  });
});

describe('xpForLevel', () => {
  it('should return 0 for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('should return 0 for level 0', () => {
    expect(xpForLevel(0)).toBe(0);
  });

  it('should return positive value for level 2', () => {
    expect(xpForLevel(2)).toBeGreaterThan(0);
  });

  it('should clamp to MAX_LEVEL', () => {
    const maxXp = xpForLevel(GAME_CONSTANTS.MAX_LEVEL);
    expect(xpForLevel(GAME_CONSTANTS.MAX_LEVEL + 100)).toBe(maxXp);
  });
});

describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('test@example.com').valid).toBe(true);
  });

  it('should reject empty email', () => {
    expect(validateEmail('').valid).toBe(false);
  });

  it('should reject missing @', () => {
    const result = validateEmail('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid email format');
  });

  it('should reject whitespace-only email', () => {
    expect(validateEmail('   ').valid).toBe(false);
  });
});

describe('validateCharacterName', () => {
  it('should accept valid name', () => {
    expect(validateCharacterName('PlayerOne').valid).toBe(true);
  });

  it('should accept name with numbers and hyphens', () => {
    expect(validateCharacterName('Dark-Knight_42').valid).toBe(true);
  });

  it('should reject empty name', () => {
    expect(validateCharacterName('').valid).toBe(false);
  });

  it('should reject short name', () => {
    const result = validateCharacterName('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 3 characters');
  });

  it('should reject name with special characters', () => {
    const result = validateCharacterName('Player@Name!');
    expect(result.valid).toBe(false);
  });

  it('should reject long name', () => {
    const result = validateCharacterName('a'.repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most 20 characters');
  });
});
