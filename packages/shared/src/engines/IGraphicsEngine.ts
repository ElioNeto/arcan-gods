/**
 * Graphics Engine Interface (#64)
 *
 * Defines the contract for all visual rendering: sprites, animations,
 * camera, particles, layers, and visual effects.
 *
 * Implementations: client/src/engines/GraphicsEngine.ts (PixiJS)
 * This interface is pure — NO runtime dependencies.
 */

// ─── Sprite & Animation ───────────────────────────────────────────

export interface AnimationFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  duration?: number; // ms, defaults to animation frameDuration
}

export interface AnimationConfig {
  key: string;
  frames: AnimationFrame[];
  frameDuration: number; // ms per frame
  loop: boolean;
  speed?: number; // playback multiplier (1 = normal)
}

export interface ISpriteHandle {
  readonly id: string;
  setPosition(x: number, y: number): void;
  setVisible(visible: boolean): void;
  setScale(scaleX: number, scaleY: number): void;
  setAlpha(alpha: number): void;
  playAnimation(key: string, loop?: boolean): void;
  stopAnimation(): void;
  destroy(): void;
}

// ─── Camera ───────────────────────────────────────────────────────

export interface ICameraState {
  zoom: number;
  x: number; // world X position (center)
  y: number; // world Y position (center)
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface ICamera {
  follow(target: { x: number; y: number }): void;
  unfollow(): void;
  setZoom(level: number): void;
  getZoom(): number;
  setBounds(minX: number, minY: number, maxX: number, maxY: number): void;
  screenToWorld(screenX: number, screenY: number): { x: number; y: number };
  worldToScreen(worldX: number, worldY: number): { x: number; y: number };
  shake(intensity: number, duration: number): void;
  snapToTarget(): void;
  getState(): ICameraState;
  update(deltaSec: number): void;
}

// ─── Particles ────────────────────────────────────────────────────

export interface ParticleConfig {
  textureKey?: string;
  color?: number;
  lifetime: number; // seconds
  speed: number;
  direction: number; // radians
  spread: number; // radians
  startScale: number;
  endScale: number;
  startAlpha: number;
  endAlpha: number;
  count: number;
  gravity?: number;
  fadeOut?: boolean;
}

export interface IParticleEffect {
  readonly id: string;
  setPosition(x: number, y: number): void;
  stop(immediate?: boolean): void;
  isAlive(): boolean;
  destroy(): void;
}

// ─── Layers ───────────────────────────────────────────────────────

export enum RenderLayer {
  GROUND = 0,
  WALLS = 1,
  DECORATION = 2,
  ENTITIES = 3,
  EFFECTS = 4,
  UI = 5,
  OVERLAY = 6,
}

// ─── Visual Effects ───────────────────────────────────────────────

export interface HitFlashConfig {
  color: number;
  duration: number; // ms
  flashCount: number;
}

export interface DamageNumberConfig {
  fontSize: number;
  normalColor: number;
  criticalColor: number;
  driftSpeed: number; // px/s upward
  lifetime: number; // seconds
}

// ─── Engine Interface ─────────────────────────────────────────────

export interface IGraphicsEngine {
  // Lifecycle
  init(canvas: HTMLCanvasElement | null, width: number, height: number): Promise<void>;
  resize(width: number, height: number): void;
  destroy(): void;

  // Sprites & Animation
  loadSpriteSheet(key: string, url: string, frameWidth: number, frameHeight: number): Promise<boolean>;
  createSprite(sheetKey: string, x?: number, y?: number): ISpriteHandle;
  defineAnimation(sheetKey: string, config: AnimationConfig): void;

  // Camera
  getCamera(): ICamera;

  // Particles
  emitParticles(config: ParticleConfig, x: number, y: number): IParticleEffect;
  clearParticles(): void;

  // Effects
  hitFlash(spriteId: string, config?: HitFlashConfig): void;
  showDamageNumber(x: number, y: number, damage: number, isCritical?: boolean): void;

  // Layers
  setLayerVisibility(layer: RenderLayer, visible: boolean): void;
  setLayerOpacity(layer: RenderLayer, opacity: number): void;

  // Update
  update(deltaSec: number): void;
}
