import { GAME_CONSTANTS, XP_TABLE } from '../constants/game.js';

/**
 * Calculate the level for a given amount of total experience.
 * Uses binary search on XP_TABLE for efficiency.
 */
export function calculateLevel(experience: number): number {
  if (experience <= 0) return 1;

  let low = 1;
  let high = GAME_CONSTANTS.MAX_LEVEL;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (XP_TABLE[mid] <= experience) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

/**
 * Calculate total XP needed to reach a given level.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > GAME_CONSTANTS.MAX_LEVEL) return XP_TABLE[GAME_CONSTANTS.MAX_LEVEL];
  return XP_TABLE[level];
}

/**
 * Validate email format.
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true };
}

/**
 * Validate character name.
 */
export function validateCharacterName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }

  if (name.length > 20) {
    return { valid: false, error: 'Name must be at most 20 characters' };
  }

  const nameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, error: 'Name can only contain letters, numbers, hyphens, and underscores' };
  }

  return { valid: true };
}
