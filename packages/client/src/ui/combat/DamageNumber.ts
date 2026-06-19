import { Container, Text, TextStyle } from 'pixi.js';

const DAMAGE_LIFETIME = 1.5; // seconds
const DRIFT_SPEED = -30; // pixels per second (upward)
const TOTAL_DRIFT = DRIFT_SPEED * DAMAGE_LIFETIME; // -45px

const NORMAL_COLOR = 0xff4444;
const CRITICAL_COLOR = 0xffff44;
const NORMAL_SIZE = 14;
const CRITICAL_SIZE = 18;

/**
 * DamageNumber — Floating damage text that drifts up and fades out.
 *
 * - Normal damage: red (#ff4444), 14px
 * - Critical hit:   yellow (#ffff44), 18px bold
 * - Drifts upward at 30px/s for 1.5s
 * - Alpha fades linearly over 1.5s
 * - Auto-removed via isDead() / destroy()
 */
export class DamageNumber {
  private text: Text;
  private elapsed: number = 0;
  private startY: number;
  private parent: Container;

  constructor(
    x: number,
    y: number,
    damage: number,
    isCritical: boolean,
    container: Container,
  ) {
    this.startY = y;
    this.parent = container;

    const size = isCritical ? CRITICAL_SIZE : NORMAL_SIZE;
    const color = isCritical ? CRITICAL_COLOR : NORMAL_COLOR;

    this.text = new Text({
      text: String(damage),
      style: new TextStyle({
        fontSize: size,
        fill: color,
        fontFamily: 'monospace',
        fontWeight: isCritical ? 'bold' : 'normal',
      }),
    });

    this.text.anchor.set(0.5, 0.5);
    this.text.x = x;
    this.text.y = y;
    this.text.alpha = 1;

    container.addChild(this.text);
  }

  /**
   * Advance the animation by `deltaSec` seconds.
   * Moves text upward and reduces alpha.
   */
  update(deltaSec: number): void {
    this.elapsed += deltaSec;

    if (this.elapsed >= DAMAGE_LIFETIME) {
      this.text.alpha = 0;
      return;
    }

    const progress = this.elapsed / DAMAGE_LIFETIME;
    this.text.y = this.startY + TOTAL_DRIFT * progress;
    this.text.alpha = 1 - progress;
  }

  /** Returns true when the animation has completed and the text should be removed. */
  isDead(): boolean {
    return this.elapsed >= DAMAGE_LIFETIME;
  }

  /** Remove the text from its parent and destroy the PixiJS object. */
  destroy(): void {
    this.parent.removeChild(this.text);
    this.text.destroy();
  }
}
