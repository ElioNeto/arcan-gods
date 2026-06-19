import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { IPlayer } from '@arcan-gods/shared';

const BAR_WIDTH = 200;
const BAR_HEIGHT = 20;
const XP_BAR_HEIGHT = 12;
const PADDING = 10;
const GAP = 4;

const HP_COLOR = 0xff4444;
const MP_COLOR = 0x4444ff;
const XP_COLOR = 0xffff44;
const BG_COLOR = 0x333333;

/**
 * HUD — Basic heads-up display for the player.
 *
 * Renders HP, MP, and XP bars (Graphics-based) plus level and name text.
 * Positioned at top-left corner with 10px padding (MU-like).
 */
export class HUD {
  private container: Container;
  private hpBar: Graphics;
  private mpBar: Graphics;
  private xpBar: Graphics;
  private levelText: Text;
  private nameText: Text;

  constructor() {
    this.container = new Container();
    this.container.x = PADDING;
    this.container.y = PADDING;

    // -- HP Bar --
    const hpBg = this.createBarBg(BAR_WIDTH, BAR_HEIGHT, BG_COLOR);
    hpBg.y = 0;
    this.container.addChild(hpBg);

    this.hpBar = new Graphics();
    this.hpBar.y = 0;
    this.container.addChild(this.hpBar);

    // -- MP Bar --
    const mpBg = this.createBarBg(BAR_WIDTH, BAR_HEIGHT, BG_COLOR);
    mpBg.y = BAR_HEIGHT + GAP;
    this.container.addChild(mpBg);

    this.mpBar = new Graphics();
    this.mpBar.y = BAR_HEIGHT + GAP;
    this.container.addChild(this.mpBar);

    // -- XP Bar --
    const xpBg = this.createBarBg(BAR_WIDTH, XP_BAR_HEIGHT, BG_COLOR);
    xpBg.y = (BAR_HEIGHT + GAP) * 2;
    this.container.addChild(xpBg);

    this.xpBar = new Graphics();
    this.xpBar.y = (BAR_HEIGHT + GAP) * 2;
    this.container.addChild(this.xpBar);

    // -- Level text --
    this.levelText = new Text({
      text: 'Lv. 1',
      style: new TextStyle({
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: 'monospace',
      }),
    });
    this.levelText.x = BAR_WIDTH + 10;
    this.levelText.y = 0;
    this.container.addChild(this.levelText);

    // -- Name text --
    this.nameText = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: 'monospace',
        fontWeight: 'bold',
      }),
    });
    this.nameText.x = 0;
    this.nameText.y = -(this.nameText.height + 2);
    this.container.addChild(this.nameText);

    // Draw initial empty bars
    this.drawBar(this.hpBar, BAR_WIDTH, BAR_HEIGHT, HP_COLOR, 0);
    this.drawBar(this.mpBar, BAR_WIDTH, BAR_HEIGHT, MP_COLOR, 0);
    this.drawBar(this.xpBar, BAR_WIDTH, XP_BAR_HEIGHT, XP_COLOR, 0);
  }

  /** Shared background rect for bars */
  private createBarBg(width: number, height: number, color: number): Graphics {
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({ color });
    return bg;
  }

  /** Redraw a single bar fill */
  private drawBar(
    graphics: Graphics,
    width: number,
    height: number,
    color: number,
    fillPercent: number,
  ): void {
    graphics.clear();
    if (fillPercent > 0) {
      graphics.rect(0, 0, width * fillPercent, height);
      graphics.fill({ color });
    }
  }

  /**
   * Update the HUD with fresh player data.
   * All ratios are clamped between 0 and 1, with safe division.
   */
  update(playerData: IPlayer): void {
    const safeDiv = (a: number, b: number): number =>
      b <= 0 ? 0 : Math.max(0, Math.min(1, a / b));

    const hpRatio = safeDiv(playerData.hp, playerData.maxHp);
    const mpRatio = safeDiv(playerData.mp, playerData.maxMp);
    const xpRatio = safeDiv(playerData.experience, playerData.experienceToNext);

    this.drawBar(this.hpBar, BAR_WIDTH, BAR_HEIGHT, HP_COLOR, hpRatio);
    this.drawBar(this.mpBar, BAR_WIDTH, BAR_HEIGHT, MP_COLOR, mpRatio);
    this.drawBar(this.xpBar, BAR_WIDTH, XP_BAR_HEIGHT, XP_COLOR, xpRatio);

    this.levelText.text = `Lv. ${playerData.level}`;
    this.nameText.text = playerData.name;
  }

  getContainer(): Container {
    return this.container;
  }

  /** No-op: HUD is fixed to top-left corner. Kept for future responsive layout. */
  resize(_width: number, _height: number): void {
    // HUD position is fixed (PADDING, PADDING)
  }
}
