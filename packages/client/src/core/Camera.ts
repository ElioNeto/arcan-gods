import { Container } from 'pixi.js';
import { GAME_CONSTANTS } from '@arcan-gods/shared';

const TILE_SIZE = GAME_CONSTANTS.TILE_SIZE;

/**
 * Camera follows a target entity, converting between screen pixel space
 * and world tile space.
 *
 * The world container is positioned so that the target entity appears
 * centered on screen. All positions are in PIXELS internally (tile × TILE_SIZE).
 */
export class Camera {
  private container: Container;
  private target: { x: number; y: number } | null = null;
  private screenWidth: number;
  private screenHeight: number;
  private smoothFactor: number = 0.1;

  constructor(container: Container, screenWidth: number, screenHeight: number) {
    this.container = container;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /**
   * Start following an entity. The target's x/y are in TILE coordinates.
   */
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

  /**
   * Updates camera position to follow the target.
   * target.x/y are in tile coords — converted to pixels via TILE_SIZE.
   */
  update(): void {
    if (!this.target) return;

    // Camera center should be at the target's pixel position on screen
    const targetPixelX = this.target.x * TILE_SIZE;
    const targetPixelY = this.target.y * TILE_SIZE;

    // Container offset = negative target position + half screen size
    // This places the target at the center of the screen
    const targetOffsetX = -targetPixelX + this.screenWidth / 2;
    const targetOffsetY = -targetPixelY + this.screenHeight / 2;

    // Smooth interpolation
    this.container.x += (targetOffsetX - this.container.x) * this.smoothFactor;
    this.container.y += (targetOffsetY - this.container.y) * this.smoothFactor;
  }

  /**
   * Immediately center on the target without smoothing.
   */
  snapToTarget(): void {
    if (!this.target) return;
    this.container.x = -(this.target.x * TILE_SIZE) + this.screenWidth / 2;
    this.container.y = -(this.target.y * TILE_SIZE) + this.screenHeight / 2;
  }

  getContainer(): Container {
    return this.container;
  }

  /**
   * Converts screen pixel coordinates to world TILE coordinates.
   * Takes into account the camera offset and TILE_SIZE scaling.
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    // World pixel position (relative to world container origin)
    const worldPixelX = screenX - this.container.x;
    const worldPixelY = screenY - this.container.y;

    // Convert pixels to tiles
    return {
      x: Math.floor(worldPixelX / TILE_SIZE),
      y: Math.floor(worldPixelY / TILE_SIZE),
    };
  }
}
