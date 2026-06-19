/**
 * Graphics Engine — client implementation (#64)
 *
 * Wraps PixiJS rendering: camera, sprite management, particles, effects.
 * Implements IGraphicsEngine from shared/.
 *
 * Uses Strangler Fig pattern — existing code still works, new code
 * goes through this engine.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { IGraphicsEngine, ICamera, ISpriteHandle, ICameraState, AnimationConfig, ParticleConfig, IParticleEffect, HitFlashConfig, RenderLayer } from '@arcan-gods/shared';
import { GAME_CONSTANTS } from '@arcan-gods/shared';
import { Camera } from '../core/Camera.js';

const TILE_SIZE = GAME_CONSTANTS.TILE_SIZE;

/**
 * Simple sprite handle wrapping a PixiJS Container.
 * For MVP, uses Graphics rectangles. Full sprite sheet animation later.
 */
class SimpleSprite implements ISpriteHandle {
  readonly id: string;
  private container: Container;
  private gfx: Graphics;

  constructor(id: string, container: Container, color: number = 0x4488ff, size: number = 32) {
    this.id = id;
    this.container = container;
    this.gfx = new Graphics();
    this.gfx.rect(-size / 2, -size, size, size);
    this.gfx.fill({ color });
    container.addChild(this.gfx);
  }

  setPosition(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  setScale(scaleX: number, scaleY: number): void {
    this.container.scale.set(scaleX, scaleY);
  }

  setAlpha(alpha: number): void {
    this.container.alpha = alpha;
  }

  playAnimation(_key: string, _loop?: boolean): void {
    // No-op for MVP
  }

  stopAnimation(): void {
    // No-op for MVP
  }

  destroy(): void {
    this.container.removeChild(this.gfx);
    this.gfx.destroy();
  }
}

export class GraphicsEngine implements IGraphicsEngine {
  private worldContainer: Container;
  private uiContainer: Container;
  private camera: Camera;
  private spriteCounter: number = 0;

  constructor(worldContainer: Container, uiContainer: Container) {
    this.worldContainer = worldContainer;
    this.uiContainer = uiContainer;
    this.camera = new Camera(this.worldContainer, 1920, 1080);
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
  }

  // ─── Sprites ─────────────────────────────────────────────────

  async loadSpriteSheet(_key: string, _url: string, _frameWidth: number, _frameHeight: number): Promise<boolean> {
    // Delegates to AssetManager
    return true;
  }

  createSprite(_sheetKey: string, x?: number, y?: number): ISpriteHandle {
    const id = `sprite_${++this.spriteCounter}`;
    const container = new Container();
    container.x = x ?? 0;
    container.y = y ?? 0;
    this.worldContainer.addChild(container);
    return new SimpleSprite(id, container);
  }

  defineAnimation(_sheetKey: string, _config: AnimationConfig): void {
    // No-op for MVP
  }

  // ─── Camera ──────────────────────────────────────────────────

  getCamera(): ICamera {
    return {
      follow: (target) => this.camera.follow(target),
      unfollow: () => this.camera.unfollow(),
      setZoom: (_level) => { /* no-op for MVP */ },
      getZoom: () => 1,
      setBounds: (_minX, _minY, _maxX, _maxY) => { /* no-op */ },
      screenToWorld: (sx, sy) => this.camera.screenToWorld(sx, sy),
      worldToScreen: (wx, wy) => ({
        x: wx * TILE_SIZE + this.worldContainer.x,
        y: wy * TILE_SIZE + this.worldContainer.y,
      }),
      shake: (_intensity, _duration) => { /* no-op for MVP */ },
      snapToTarget: () => this.camera.snapToTarget(),
      getState: (): ICameraState => ({
        zoom: 1,
        x: -this.worldContainer.x,
        y: -this.worldContainer.y,
      }),
      update: (_dt) => this.camera.update(),
    };
  }

  // ─── Particles ───────────────────────────────────────────────

  emitParticles(_config: ParticleConfig, _x: number, _y: number): IParticleEffect {
    return { id: '', setPosition: () => {}, stop: () => {}, isAlive: () => false, destroy: () => {} };
  }

  clearParticles(): void {}

  // ─── Effects ─────────────────────────────────────────────────

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

    // Simple fade out animation
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
      text.y = y - progress * 45; // drift up
      text.alpha = 1 - progress;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // ─── Layers ──────────────────────────────────────────────────

  setLayerVisibility(_layer: RenderLayer, _visible: boolean): void {}
  setLayerOpacity(_layer: RenderLayer, _opacity: number): void {}

  // ─── Update ──────────────────────────────────────────────────

  update(_deltaSec: number): void {
    this.camera.update();
  }
}
