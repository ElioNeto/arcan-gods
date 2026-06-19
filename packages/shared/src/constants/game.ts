export const GAME_CONSTANTS = {
  TILE_SIZE: 32,
  TICK_RATE: 100, // ms (10 Hz)
  MAX_LEVEL: 400,
  MAX_STAT_POINTS: 65000,
  BASE_HP: 50,
  BASE_MP: 10,
  XP_MULTIPLIER: 100,
  DROP_RATE: 0.1,
  GOLD_MULTIPLIER: 1,
  INVENTORY_COLS: 8,
  INVENTORY_ROWS: 5,
  MAX_PARTY_SIZE: 5,
  MAX_GUILD_MEMBERS: 50,
  VIEW_RANGE: 15, // tiles
  ATTACK_RANGE: 2,
  STAMINA_COST_PER_TILE: 1,
  STAMINA_REGEN_PER_TICK: 1,
  BASE_STAMINA: 100,
} as const;

export const XP_TABLE: number[] = [];
for (let i = 0; i <= GAME_CONSTANTS.MAX_LEVEL; i++) {
  XP_TABLE[i] = Math.floor(GAME_CONSTANTS.XP_MULTIPLIER * Math.pow(i, 2.5));
}

export const CLASS_BASE_STATS: Record<string, { str: number; agi: number; ene: number; vit: number }> = {
  'dark_knight': { str: 28, agi: 20, ene: 15, vit: 25 },
  'dark_wizard': { str: 18, agi: 18, ene: 30, vit: 20 },
  'elf': { str: 22, agi: 25, ene: 20, vit: 20 },
  'summoner': { str: 20, agi: 20, ene: 28, vit: 18 },
  'magic_gladiator': { str: 26, agi: 22, ene: 20, vit: 22 },
};
