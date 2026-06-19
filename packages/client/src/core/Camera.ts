/**
 * Camera — follows a target entity with smooth scroll and zoom.
 *
 * Converte entre coordenadas de tela (pixels) e mundo (tiles).
 * Suporta zoom in (mais próximo) e screen shake.
 *
 * Fórmulas de transformação:
 *   screenPos = container.pos + (worldPos * scale)
 *   worldPos = (screenPos - container.pos) / scale
 *   tile = Math.floor(worldPos / TILE_SIZE)
 */

import { Container } from 'pixi.js';
import { GAME_CONSTANTS } from '@arcan-gods/shared';

const TILE_SIZE = GAME_CONSTANTS.TILE_SIZE;
const DEFAULT_ZOOM = 2.0; // 2x = câmera mais próxima do personagem

export class Camera {
  private container: Container;
  private target: { x: number; y: number } | null = null;
  private screenWidth: number;
  private screenHeight: number;
  private smoothFactor: number = 0.08;
  private _zoom: number = DEFAULT_ZOOM;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeElapsed: number = 0;

  constructor(container: Container, screenWidth: number, screenHeight: number) {
    this.container = container;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.container.scale.set(this._zoom);
  }

  follow(target: { x: number; y: number }): void {
    this.target = target;
  }

  unfollow(): void {
    this.target = null;
  }

  setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  setZoom(level: number): void {
    this._zoom = Math.max(0.5, Math.min(4, level));
    this.container.scale.set(this._zoom);
  }

  getZoom(): number {
    return this._zoom;
  }

  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  update(): void {
    if (!this.target) return;

    const targetPixelX = this.target.x * TILE_SIZE;
    const targetPixelY = this.target.y * TILE_SIZE;

    // Camera offset: we want the target at screen center
    // screenCenter = container.x + targetPixelX * zoom
    // container.x = screenCenter - targetPixelX * zoom
    const targetOffsetX = (this.screenWidth / 2) - (targetPixelX * this._zoom);
    const targetOffsetY = (this.screenHeight / 2) - (targetPixelY * this._zoom);

    // Smooth interpolation
    this.container.x += (targetOffsetX - this.container.x) * this.smoothFactor;
    this.container.y += (targetOffsetY - this.container.y) * this.smoothFactor;

    // Screen shake
    if (this.shakeDuration > 0) {
      this.shakeElapsed += 16;
      const progress = this.shakeElapsed / this.shakeDuration;
      if (progress >= 1) {
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
      } else {
        const decay = 1 - progress;
        this.container.x += (Math.random() - 0.5) * this.shakeIntensity * decay;
        this.container.y += (Math.random() - 0.5) * this.shakeIntensity * decay;
      }
    }
  }

  snapToTarget(): void {
    if (!this.target) return;
    this.container.x = (this.screenWidth / 2) - (this.target.x * TILE_SIZE * this._zoom);
    this.container.y = (this.screenHeight / 2) - (this.target.y * TILE_SIZE * this._zoom);
  }

  getContainer(): Container {
    return this.container;
  }

  /** Converte coordenadas da tela para tiles do mundo (considerando zoom) */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const worldPixelX = (screenX - this.container.x) / this._zoom;
    const worldPixelY = (screenY - this.container.y) / this._zoom;
    return {
      x: Math.floor(worldPixelX / TILE_SIZE),
      y: Math.floor(worldPixelY / TILE_SIZE),
    };
  }
}
