import { Container, Graphics } from 'pixi.js';

const BAR_WIDTH = 30;
const BAR_HEIGHT = 4;
/** Vertical offset above the entity (negative = up) */
const Y_OFFSET = -8;
const BG_COLOR = 0x333333;
const HP_COLOR = 0xff4444;

/**
 * EntityHealthBar — A small HP bar displayed above an entity (monster).
 *
 * - Background: dark grey 30×4px
 * - Fill: red, width proportional to current HP / max HP
 * - Position is updated via setPosition() to follow the entity
 */
export class EntityHealthBar {
  private container: Container;
  private bgBar: Graphics;
  private fillBar: Graphics;

  constructor(
    private entityId: string,
    initialHp: number,
    maxHp: number,
    parent: Container,
  ) {
    this.container = new Container();

    // Background
    this.bgBar = new Graphics();
    this.bgBar.rect(0, 0, BAR_WIDTH, BAR_HEIGHT);
    this.bgBar.fill({ color: BG_COLOR });
    this.container.addChild(this.bgBar);

    // Fill (red HP)
    this.fillBar = new Graphics();
    this.container.addChild(this.fillBar);

    parent.addChild(this.container);

    this.update(initialHp, maxHp);
  }

  /**
   * Update the bar to reflect current HP.
   * Ratio is clamped between 0 and 1.
   */
  update(hp: number, maxHp: number): void {
    const ratio = maxHp <= 0 ? 0 : Math.max(0, Math.min(1, hp / maxHp));

    this.fillBar.clear();
    if (ratio > 0) {
      this.fillBar.rect(0, 0, BAR_WIDTH * ratio, BAR_HEIGHT);
      this.fillBar.fill({ color: HP_COLOR });
    }
  }

  /** Reposition the bar centered above the entity. */
  setPosition(x: number, y: number): void {
    this.container.x = x - BAR_WIDTH / 2;
    this.container.y = y + Y_OFFSET;
  }

  /** Remove from parent and destroy all PixiJS objects. */
  destroy(): void {
    this.container.removeFromParent();
    this.container.destroy({ children: true });
  }

  getEntityId(): string {
    return this.entityId;
  }
}
