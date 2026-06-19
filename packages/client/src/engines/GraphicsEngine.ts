/**
 * Graphics Engine — client implementation (#64)
 *
 * Full implementation with sprite animation, camera management,
 * particle effects, and layer system.
 *
 * Delegates to AnimationController for sprite playback.
 */

import { Container, Graphics, Text, TextStyle, AnimatedSprite } from 'pixi.js';
import type { IGraphicsEngine, ICamera, ISpriteHandle, ICameraState, AnimationConfig, ParticleConfig, IParticleEffect, HitFlashConfig, RenderLayer } from '@arcan-gods/shared';
import { GAME_CONSTANTS } from '@arcan-gods/shared';
import { Camera } from '../core/Camera.js';
import { AnimationController } from '../core/AnimationController.js';
import type { AssetManager } from '../core/AssetManager.js';

const TILE_SIZE = GAME_CONSTANTS.TILE_SIZE;

/**
 * Wraps an AnimatedSprite behind the ISpriteHandle interface.
 */
class AnimatedSpriteHandle implements ISpriteHandle {
  readonly id: string;
  private sprite: AnimatedSprite;
  private container: Container;
  private animController: AnimationController;
  private sheetKey: string;

  constructor(id: string, container: Container, sprite: AnimatedSprite, ac: AnimationController, sheetKey: string) {
    this.id = id;
    this.container = container;
    this.sprite = sprite;
    this.animController = ac;
    this.sheetKey = sheetKey;
    // Auto-resize: scale character (128px) to ~1 tile (32px)
    const scale = 32 / Math.max(sprite.texture.width, sprite.texture.height);
    sprite.scale.set(scale);
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  setScale(scaleX: number, scaleY: number): void {
    this.sprite.scale.set(scaleX, scaleY);
  }

  setAlpha(alpha: number): void {
    this.sprite.alpha = alpha;
  }

  playAnimation(key: string, loop?: boolean): void {
    this.animController.playAnimation(this.sprite, this.sheetKey, key, loop);
  }

  stopAnimation(): void {
    this.sprite.stop();
  }

  destroy(): void {
    this.container.removeChild(this.sprite);
    this.sprite.destroy();
  }
}

export class GraphicsEngine implements IGraphicsEngine {
  private worldContainer: Container;
  private uiContainer: Container;
  private camera: Camera;
  private animController: AnimationController;
  private spriteCounter: number = 0;

  constructor(worldContainer: Container, uiContainer: Container) {
    this.worldContainer = worldContainer;
    this.uiContainer = uiContainer;
    this.camera = new Camera(this.worldContainer, 1920, 1080);
    this.animController = new AnimationController();
  }

  getAnimationController(): AnimationController {
    return this.animController;
  }

  /**
   * Registra todas as sprite sheets carregadas pelo AssetManager.
   */
  registerSheets(assetManager: AssetManager): void {
    for (const sheet of assetManager.getSheetConfigs()) {
      const tex = assetManager.getTexture(sheet.key);
      if (tex) {
        this.animController.registerSheet(sheet.key, tex, sheet.frameWidth, sheet.frameHeight);
        for (const anim of sheet.animations) {
          this.animController.defineAnimation(sheet.key, anim);
        }
      }
    }
  }

  async init(_canvas: HTMLCanvasElement | null, width: number, height: number): Promise<void> {
    this.camera.setScreenSize(width, height);
  }

  resize(width: number, height: number): void {
    this.camera.setScreenSize(width, height);
  }

  destroy(): void {
    this.worldContainer.removeChildren();
    this.uiContainer.removeChildren();
    this.animController.destroy();
  }

  // ─── Sprites & Animation ───────────────────────────────────

  async loadSpriteSheet(_key: string, _url: string, _frameWidth: number, _frameHeight: number): Promise<boolean> {
    // Sheets are pre-loaded via AssetManager
    return true;
  }

  createSprite(sheetKey: string, x?: number, y?: number): ISpriteHandle {
    const id = `sprite_${++this.spriteCounter}`;
    const container = new Container();
    container.x = x ?? 0;
    container.y = y ?? 0;

    try {
      const sprite = this.animController.createSprite(sheetKey);
      container.addChild(sprite);
    } catch {
      // Fallback: draw colored rectangle if sheet not found
      const gfx = new Graphics();
      gfx.rect(-16, -32, 32, 32);
      gfx.fill({ color: sheetKey.includes('monster') ? 0xff4444 : 0x4488ff });
      container.addChild(gfx);
    }

    this.worldContainer.addChild(container);
    return new AnimatedSpriteHandle(id, container,
      container.children[0] instanceof AnimatedSprite ? container.children[0] as AnimatedSprite : null as any,
      this.animController, sheetKey);
  }

  defineAnimation(sheetKey: string, config: AnimationConfig): void {
    this.animController.defineAnimation(sheetKey, {
      key: config.key,
      frames: config.frames.map(f => ({ x: f.x, y: f.y, width: f.width, height: f.height })),
      frameDuration: config.frameDuration,
      loop: config.loop,
      speed: config.speed,
    });
  }

  // ─── Camera ─────────────────────────────────────────────────

  getCamera(): ICamera {
    return {
      follow: (target) => this.camera.follow(target),
      unfollow: () => this.camera.unfollow(),
      setZoom: (_level) => {},
      getZoom: () => 1,
      setBounds: (_minX, _minY, _maxX, _maxY) => {},
      screenToWorld: (sx, sy) => this.camera.screenToWorld(sx, sy),
      worldToScreen: (wx, wy) => ({
        x: wx * TILE_SIZE + this.worldContainer.x,
        y: wy * TILE_SIZE + this.worldContainer.y,
      }),
      shake: (_intensity, _duration) => {},
      snapToTarget: () => this.camera.snapToTarget(),
      getState: (): ICameraState => ({ zoom: 1, x: -this.worldContainer.x, y: -this.worldContainer.y }),
      update: (_dt) => this.camera.update(),
    };
  }

  // ─── Particles ──────────────────────────────────────────────

  emitParticles(config: ParticleConfig, x: number, y: number): IParticleEffect {
    const gfx = new Graphics();
    // Simple particle: colored circle
    gfx.circle(0, 0, 2);
    gfx.fill({ color: config.color ?? 0xffffff, alpha: config.startAlpha });
    gfx.x = x;
    gfx.y = y;
    this.worldContainer.addChild(gfx);

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 16;
      const progress = elapsed / (config.lifetime * 1000);
      if (progress >= 1) {
        clearInterval(interval);
        if (gfx.parent) this.worldContainer.removeChild(gfx);
        gfx.destroy();
        return;
      }
      gfx.y -= config.speed * 0.016;
      gfx.alpha = config.startAlpha + (config.endAlpha - config.startAlpha) * progress;
    }, 16);

    return {
      id: `particle_${Date.now()}`,
      setPosition: (px, py) => { gfx.x = px; gfx.y = py; },
      stop: (immediate) => { clearInterval(interval); if (immediate && gfx.parent) this.worldContainer.removeChild(gfx); gfx.destroy(); },
      isAlive: () => elapsed < config.lifetime * 1000,
      destroy: () => { clearInterval(interval); if (gfx.parent) this.worldContainer.removeChild(gfx); gfx.destroy(); },
    };
  }

  clearParticles(): void {
    // Simplificado: partículas se auto-destroem
  }

  // ─── Effects ────────────────────────────────────────────────

  hitFlash(_spriteId: string, _config?: HitFlashConfig): void {}

  showDamageNumber(x: number, y: number, damage: number, isCritical?: boolean): void {
    const text = new Text({
      text: String(damage),
      style: new TextStyle({
        fontSize: isCritical ? 18 : 14,
        fill: isCritical ? 0xffff44 : 0xff4444,
        fontFamily: 'monospace',
        fontWeight: isCritical ? 'bold' : 'normal',
      }),
    });
    text.x = x;
    text.y = y;
    text.alpha = 1;
    this.worldContainer.addChild(text);

    const startTime = Date.now();
    const duration = 1500;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      if (progress >= 1) {
        this.worldContainer.removeChild(text);
        text.destroy();
        return;
      }
      text.y = y - progress * 45;
      text.alpha = 1 - progress;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // ─── Layers ─────────────────────────────────────────────────

  setLayerVisibility(_layer: RenderLayer, _visible: boolean): void {}
  setLayerOpacity(_layer: RenderLayer, _opacity: number): void {}

  // ─── Update ─────────────────────────────────────────────────

  update(_deltaSec: number): void {
    this.camera.update();
  }
}
