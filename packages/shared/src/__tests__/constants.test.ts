import { describe, it, expect } from 'vitest';
import { GAME_CONSTANTS, XP_TABLE, CLASS_BASE_STATS } from '../constants/game.js';

describe('GAME_CONSTANTS', () => {
  it('should have TILE_SIZE defined', () => {
    expect(GAME_CONSTANTS.TILE_SIZE).toBe(32);
  });

  it('should have TICK_RATE defined', () => {
    expect(GAME_CONSTANTS.TICK_RATE).toBe(100);
  });

  it('should have MAX_LEVEL defined', () => {
    expect(GAME_CONSTANTS.MAX_LEVEL).toBe(400);
  });
});

describe('XP_TABLE', () => {
  it('should have correct length', () => {
    expect(XP_TABLE.length).toBe(GAME_CONSTANTS.MAX_LEVEL + 1);
  });

  it('should have increasing values', () => {
    for (let i = 1; i < XP_TABLE.length; i++) {
      expect(XP_TABLE[i]).toBeGreaterThan(XP_TABLE[i - 1]);
    }
  });
});

describe('CLASS_BASE_STATS', () => {
  it('should have all classes defined', () => {
    expect(CLASS_BASE_STATS).toHaveProperty('dark_knight');
    expect(CLASS_BASE_STATS).toHaveProperty('dark_wizard');
    expect(CLASS_BASE_STATS).toHaveProperty('elf');
    expect(CLASS_BASE_STATS).toHaveProperty('summoner');
    expect(CLASS_BASE_STATS).toHaveProperty('magic_gladiator');
  });
});
