import { Texture } from 'pixi.js';

export class AssetManager {
  private textures: Map<string, Texture> = new Map();
  private loaded: boolean = false;

  async init(): Promise<void> {
    this.generatePlaceholders();
    this.loaded = true;
  }

  getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  private generatePlaceholders(): void {
    this.textures.set('player_placeholder', this.createColorTexture(0x4488ff));
    this.textures.set('monster_placeholder', this.createColorTexture(0xff4444));
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
