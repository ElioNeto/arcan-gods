export type CharacterClass =
  | 'dark_knight'
  | 'dark_wizard'
  | 'elf'
  | 'summoner'
  | 'magic_gladiator';

export type MapId = string; // e.g., 'lorencia', 'devias', 'noria'

export type EntityType = 'player' | 'monster' | 'npc' | 'item';

export type Direction = 'down' | 'left' | 'right' | 'up';

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'boots'
  | 'gloves'
  | 'shield'
  | 'wings'
  | 'jewelry'
  | 'consumable';

export type ItemTier = 'normal' | 'magic' | 'rare' | 'unique' | 'legend';

export type GameState = 'loading' | 'menu' | 'world' | 'combat';

export type ChatChannel = 'global' | 'party' | 'guild' | 'whisper';
