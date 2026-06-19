import { Assets, Texture, Rectangle } from 'pixi.js';

export class AssetManager {
  private textures: Map<string, Texture> = new Map();
  private loaded: boolean = false;

  async init(): Promise<void> {
    await this.loadSpriteSheets();
    this.generatePlaceholders();
    this.loaded = true;
  }

  getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /** Returns the full texture cache map (for sharing with renderers) */
  getTextureCache(): Map<string, Texture> {
    return this.textures;
  }

  /**
   * Loads sprite sheets and extracts individual frame textures.
   */
  private async loadSpriteSheets(): Promise<void> {
    // Note: frame sizes determined from actual sprite sheet dimensions
    // Dark Knight (Converted Vampire): frames are 128x128
    // Dogs/Cats: frames are 48x48

    // Dark Knight — Walk: 1024x128 = 8 frames
    await this.loadSheet('player_walk', '/assets/characters/dark_knight_walk.png', 8, 128, 128);
    // Dark Knight — Idle: 640x128 = 5 frames (use first frame)
    await this.loadSheet('player_idle', '/assets/characters/dark_knight_idle.png', 5, 128, 128);

    // Monster sprites (48x48 frames, use first frame)
    await this.loadSheet('dog', '/assets/monsters/dog_walk.png', 6, 48, 48);
    await this.loadSheet('cat', '/assets/monsters/cat_walk.png', 6, 48, 48);
    await this.loadSheet('bird', '/assets/monsters/bird_walk.png', 6, 48, 48);
  }

  /**
   * Loads a sprite sheet and registers the first frame as a texture.
   * Full animation support to be added later.
   */
  private async loadSheet(
    key: string,
    url: string,
    _frameCount: number,
    frameWidth: number,
    frameHeight: number,
  ): Promise<void> {
    try {
      const texture = await Assets.load(url);
      // Extract first frame from sprite sheet
      const firstFrame = new Texture({
        source: texture.source,
        frame: new Rectangle(0, 0, frameWidth, frameHeight),
      });
      this.textures.set(key, firstFrame);
    } catch (err) {
      console.warn(`Failed to load sprite sheet ${url}, using placeholder`, err);
    }
  }

  private generatePlaceholders(): void {
    if (!this.textures.has('player_walk')) {
      this.textures.set('player_placeholder', this.createColorTexture(0x4488ff));
    }
    if (!this.textures.has('dog') && !this.textures.has('cat')) {
      this.textures.set('monster_placeholder', this.createColorTexture(0xff4444));
    }
    this.textures.set('npc_placeholder', this.createColorTexture(0x44ff44));
    this.textures.set('tile_floor', this.createColorTexture(0x3a3a3a));
    this.textures.set('tile_wall', this.createColorTexture(0x555555));
    this.textures.set('tile_grass', this.createColorTexture(0x2d5a27));
  }

  private createColorTexture(color: number): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 32, 32);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(0.5, 0.5, 31, 31);

    return Texture.from(canvas);
  }
}
