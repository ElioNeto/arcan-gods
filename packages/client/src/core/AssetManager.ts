import { Assets, Texture, Rectangle } from 'pixi.js';

/**
 * Manages game assets (textures, sprites).
 * Uses PixiJS Assets API for loading sprite sheets.
 * PlaceholderGraphics handles fallback rendering directly.
 */
export class AssetManager {
  private textures: Map<string, Texture> = new Map();
  private loaded: boolean = false;

  async init(): Promise<void> {
    await this.loadSpriteSheets();
    this.loaded = true;
  }

  getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }

  getTextureCache(): Map<string, Texture> {
    return this.textures;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Loads sprite sheets and extracts first frame from each.
   * Failures are silent — PlaceholderGraphics handles fallback.
   */
  private async loadSpriteSheets(): Promise<void> {
    const sheets: Array<[string, string, number, number, number]> = [
      ['player_walk', '/assets/characters/dark_knight_walk.png', 8, 128, 128],
      ['player_idle', '/assets/characters/dark_knight_idle.png', 5, 128, 128],
      ['monster_dog', '/assets/monsters/dog_walk.png', 6, 48, 48],
      ['monster_cat', '/assets/monsters/cat_walk.png', 6, 48, 48],
      ['monster_bird', '/assets/monsters/bird_walk.png', 6, 48, 48],
    ];

    const promises = sheets.map(async ([key, url, _frames, fw, fh]) => {
      try {
        const texture = await Assets.load(url);
        this.textures.set(key, new Texture({
          source: texture.source,
          frame: new Rectangle(0, 0, fw, fh),
        }));
      } catch {
        // Fallback handled by PlaceholderGraphics
      }
    });

    await Promise.all(promises);
  }
}
