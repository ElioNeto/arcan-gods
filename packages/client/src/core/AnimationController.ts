/**
 * AnimationController — gerencia animações de sprite sheets.
 *
 * Suporta:
 * - Extração de frames de sprite sheets
 * - Animação com timing (frameDuration)
 * - Loop / single-shot
 * - Múltiplas animações por sprite (idle, walk, attack, etc.)
 * - Playback speed control
 */

import { Texture, Rectangle, AnimatedSprite, Sprite } from 'pixi.js';

export interface FrameData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimDef {
  key: string;
  frames: FrameData[];
  frameDuration: number; // ms per frame
  loop: boolean;
  speed?: number;
}

export class AnimationController {
  private animations: Map<string, AnimDef> = new Map();
  private sheetTextures: Map<string, Texture> = new Map();
  private animatedSprites: Map<string, AnimatedSprite> = new Map();

  /**
   * Registra uma sprite sheet. Extrai todos os frames automaticamente.
   */
  registerSheet(key: string, texture: Texture, frameWidth: number, frameHeight: number): void {
    this.sheetTextures.set(key, texture);

    // Extrai frames da sheet (row-major)
    const cols = Math.floor(texture.width / frameWidth);
    const rows = Math.floor(texture.height / frameHeight);
    const frames: Texture[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frame = new Texture({
          source: texture.source,
          frame: new Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight),
        });
        frames.push(frame);
      }
    }

    // Cria um AnimatedSprite para cada frame configurado
    // As animações específicas são definidas via defineAnimation
    this.animations.set(key, {
      key,
      frames: Array.from({ length: frames.length }, (_, i) => ({
        x: (i % cols) * frameWidth,
        y: Math.floor(i / cols) * frameHeight,
        width: frameWidth,
        height: frameHeight,
      })),
      frameDuration: 100,
      loop: true,
    });
  }

  /**
   * Define uma animação específica para uma sprite sheet.
   */
  defineAnimation(sheetKey: string, def: AnimDef): void {
    this.animations.set(`${sheetKey}:${def.key}`, def);
  }

  /**
   * Cria um sprite animado para uma sheet.
   */
  createSprite(sheetKey: string): AnimatedSprite {
    const baseAnim = this.animations.get(sheetKey);
    if (!baseAnim) {
      throw new Error(`Sheet '${sheetKey}' not registered`);
    }

    // Cria texturas para os frames da animação base
    const sheetTex = this.sheetTextures.get(sheetKey);
    if (!sheetTex) {
      throw new Error(`Texture for sheet '${sheetKey}' not found`);
    }

    const textures: Texture[] = baseAnim.frames.map(f => new Texture({
      source: sheetTex.source,
      frame: new Rectangle(f.x, f.y, f.width, f.height),
    }));

    const sprite = new AnimatedSprite(textures);
    sprite.anchor.set(0.5, 1); // bottom-center
    sprite.animationSpeed = 0.15;
    sprite.play();

    this.animatedSprites.set(sprite.name || `sprite_${Date.now()}`, sprite);
    return sprite;
  }

  /**
   * Toca uma animação específica em um sprite.
   * Retorna true se a animação foi encontrada e aplicada.
   */
  playAnimation(sprite: AnimatedSprite, sheetKey: string, animKey: string, loop?: boolean): boolean {
    const def = this.animations.get(`${sheetKey}:${animKey}`);
    if (!def) return false;

    const sheetTex = this.sheetTextures.get(sheetKey);
    if (!sheetTex) return false;

    const textures: Texture[] = def.frames.map(f => new Texture({
      source: sheetTex.source,
      frame: new Rectangle(f.x, f.y, f.width, f.height),
    }));

    sprite.textures = textures;
    sprite.animationSpeed = (def.speed ?? 1) * (1000 / def.frameDuration) / 60;
    sprite.loop = loop ?? def.loop;
    sprite.gotoAndPlay(0);

    return true;
  }

  /**
   * Redimensiona um sprite proporcionalmente.
   */
  resizeSprite(sprite: Sprite | AnimatedSprite, targetWidth?: number, targetHeight?: number): void {
    if (targetWidth && targetHeight) {
      sprite.width = targetWidth;
      sprite.height = targetHeight;
    } else if (targetWidth) {
      sprite.scale.set(targetWidth / sprite.texture.width);
    } else if (targetHeight) {
      sprite.scale.set(targetHeight / sprite.texture.height);
    }
  }

  /**
   * Libera recursos.
   */
  destroy(): void {
    this.animations.clear();
    this.sheetTextures.clear();
    this.animatedSprites.forEach(s => s.destroy());
    this.animatedSprites.clear();
  }
}
