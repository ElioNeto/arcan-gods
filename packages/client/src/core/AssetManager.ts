/**
 * AssetManager — carrega sprite sheets e gerencia texturas.
 *
 * Carrega sprite sheets via PixiJS Assets API, extrai frames
 * e disponibiliza para AnimationController e PlaceholderGraphics.
 */

import { Assets, Texture, Rectangle } from 'pixi.js';
import type { AnimDef } from './AnimationController.js';

export interface SheetInfo {
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  animations: AnimDef[];
}

const SHEETS: SheetInfo[] = [
  {
    key: 'player',
    url: '/assets/characters/dark_knight_walk.png',
    frameWidth: 128,
    frameHeight: 128,
    animations: [
      { key: 'idle', frames: [{ x: 0, y: 0, width: 128, height: 128 }], frameDuration: 200, loop: true, speed: 0.5 },
      { key: 'walk', frames: [
        { x: 0, y: 0, width: 128, height: 128 },
        { x: 128, y: 0, width: 128, height: 128 },
        { x: 256, y: 0, width: 128, height: 128 },
        { x: 384, y: 0, width: 128, height: 128 },
        { x: 512, y: 0, width: 128, height: 128 },
        { x: 640, y: 0, width: 128, height: 128 },
        { x: 768, y: 0, width: 128, height: 128 },
        { x: 896, y: 0, width: 128, height: 128 },
      ], frameDuration: 80, loop: true },
    ],
  },
  {
    key: 'player_idle',
    url: '/assets/characters/dark_knight_idle.png',
    frameWidth: 128,
    frameHeight: 128,
    animations: [
      { key: 'idle', frames: [
        { x: 0, y: 0, width: 128, height: 128 },
        { x: 128, y: 0, width: 128, height: 128 },
        { x: 256, y: 0, width: 128, height: 128 },
        { x: 384, y: 0, width: 128, height: 128 },
        { x: 512, y: 0, width: 128, height: 128 },
      ], frameDuration: 150, loop: true },
    ],
  },
  {
    key: 'monster_dog',
    url: '/assets/monsters/dog_walk.png',
    frameWidth: 48,
    frameHeight: 48,
    animations: [
      { key: 'walk', frames: [
        { x: 0, y: 0, width: 48, height: 48 },
        { x: 48, y: 0, width: 48, height: 48 },
        { x: 96, y: 0, width: 48, height: 48 },
        { x: 144, y: 0, width: 48, height: 48 },
        { x: 192, y: 0, width: 48, height: 48 },
        { x: 240, y: 0, width: 48, height: 48 },
      ], frameDuration: 100, loop: true },
    ],
  },
  {
    key: 'monster_cat',
    url: '/assets/monsters/cat_walk.png',
    frameWidth: 48,
    frameHeight: 48,
    animations: [
      { key: 'walk', frames: [
        { x: 0, y: 0, width: 48, height: 48 },
        { x: 48, y: 0, width: 48, height: 48 },
        { x: 96, y: 0, width: 48, height: 48 },
        { x: 144, y: 0, width: 48, height: 48 },
        { x: 192, y: 0, width: 48, height: 48 },
        { x: 240, y: 0, width: 48, height: 48 },
      ], frameDuration: 100, loop: true },
    ],
  },
  {
    key: 'monster_bird',
    url: '/assets/monsters/bird_walk.png',
    frameWidth: 48,
    frameHeight: 32,
    animations: [
      { key: 'walk', frames: [
        { x: 0, y: 0, width: 48, height: 32 },
        { x: 48, y: 0, width: 48, height: 32 },
        { x: 96, y: 0, width: 48, height: 32 },
        { x: 144, y: 0, width: 48, height: 32 },
      ], frameDuration: 100, loop: true },
    ],
  },
];

export class AssetManager {
  private textures: Map<string, Texture> = new Map();
  private loaded: boolean = false;

  async init(): Promise<void> {
    await this.loadSheets();
    this.loaded = true;
  }

  getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }

  getTextureCache(): Map<string, Texture> {
    return this.textures;
  }

  /** Retorna a config das sprite sheets para o AnimationController */
  getSheetConfigs(): SheetInfo[] {
    return SHEETS;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  private async loadSheets(): Promise<void> {
    const promises = SHEETS.map(async (sheet) => {
      try {
        const texture = await Assets.load(sheet.url);
        this.textures.set(sheet.key, texture);

        // Extrai primeiro frame individual para PlaceholderGraphics
        const firstFrame = new Texture({
          source: texture.source,
          frame: new Rectangle(0, 0, sheet.frameWidth, sheet.frameHeight),
        });
        this.textures.set(`${sheet.key}_frame0`, firstFrame);
      } catch {
        // Fallback — PlaceholderGraphics desenha retângulo
      }
    });
    await Promise.all(promises);
  }
}
