import { Container, Graphics, Text, TextStyle, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

/**
 * Creates visual representations for entities using actual sprites when available,
 * falling back to colored placeholders.
 */
export class PlaceholderGraphics {
  private static textureCache: Map<string, Texture> = new Map();

  /** Set the texture cache (populated by AssetManager) */
  static setTextureCache(cache: Map<string, Texture>): void {
    this.textureCache = cache;
  }

  static createPlayer(x: number, y: number, name: string): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    // Try to use player sprite, fallback to colored rectangle
    const tex = this.textureCache.get('player_walk') ?? this.textureCache.get('player_placeholder');
    if (tex) {
      const sprite = new Sprite(tex);
      sprite.anchor.set(0, 1); // bottom-center anchor for tile alignment
      sprite.scale.set(0.5); // 128x128 → 64x64 (2 tiles tall)
      container.addChild(sprite);
    } else {
      const body = new Graphics();
      body.rect(0, -32, 32, 32);
      body.fill({ color: 0x4488ff });
      container.addChild(body);
    }

    const label = new Text({
      text: name,
      style: new TextStyle({ fontSize: 10, fill: 0xffffff, fontFamily: 'monospace' }),
    });
    label.x = 0;
    label.y = -40;
    label.anchor.set(0, 1);
    container.addChild(label);

    return container;
  }

  static createMonster(x: number, y: number, name: string): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    // Pick a random monster texture based on name hash
    const tex = this.getMonsterTexture(name);
    if (tex) {
      const sprite = new Sprite(tex);
      sprite.anchor.set(0, 1);
      sprite.scale.set(0.5); // scale to fit tile
      container.addChild(sprite);
    } else {
      const body = new Graphics();
      body.rect(0, -32, 32, 32);
      body.fill({ color: 0xff4444 });
      container.addChild(body);
    }

    const label = new Text({
      text: name,
      style: new TextStyle({ fontSize: 9, fill: 0xff8888, fontFamily: 'monospace' }),
    });
    label.x = 0;
    label.y = -8;
    label.anchor.set(0, 1);
    container.addChild(label);

    return container;
  }

  static createNPC(x: number, y: number, name: string): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    const body = new Graphics();
    body.circle(16, 16, 16);
    body.fill({ color: 0x44ff44 });
    container.addChild(body);

    const label = new Text({
      text: name,
      style: new TextStyle({ fontSize: 9, fill: 0x88ff88, fontFamily: 'monospace' }),
    });
    label.x = 0;
    label.y = -12;
    label.anchor.set(0, 1);
    container.addChild(label);

    return container;
  }

  static createTile(x: number, y: number, tileSize: number, color: number): Graphics {
    const tile = new Graphics();
    tile.rect(x, y, tileSize, tileSize);
    tile.fill({ color });
    return tile;
  }

  private static getMonsterTexture(name: string): Texture | undefined {
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const textures = ['dog', 'cat', 'bird'];
    const idx = hash % textures.length;
    return this.textureCache.get(textures[idx]);
  }
}
