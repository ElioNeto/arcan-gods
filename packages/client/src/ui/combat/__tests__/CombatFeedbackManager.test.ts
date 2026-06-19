import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// PixiJS mocks (full enough for CombatFeedbackManager + DamageNumber + EntityHealthBar)
// ---------------------------------------------------------------------------
const { MockContainer, MockGraphics, MockText, MockTextStyle } = vi.hoisted(
  () => {
    class MockContainer {
      x = 0;
      y = 0;
      children: any[] = [];
      parent: any = null;

      addChild(child: any): void {
        this.children.push(child);
        child.parent = this;
      }
      removeChild(child: any): void {
        const idx = this.children.indexOf(child);
        if (idx >= 0) this.children.splice(idx, 1);
        if (child.parent === this) child.parent = null;
      }
      removeFromParent(): void {
        if (this.parent) {
          this.parent.removeChild(this);
        }
      }
      destroy(): void {
        this.children = [];
      }
    }

    class MockGraphics {
      x = 0;
      y = 0;
      width = 0;
      height = 0;
      private _destroyed = false;

      rect(_x: number, _y: number, w: number, h: number): this {
        this.width = w;
        this.height = h;
        return this;
      }
      fill(_options: { color: number }): this {
        return this;
      }
      clear(): this {
        this.width = 0;
        this.height = 0;
        return this;
      }
      destroy(): void {
        this._destroyed = true;
      }
      get destroyed(): boolean {
        return this._destroyed;
      }
    }

    class MockText {
      _text = '';
      style: any = {};
      x = 0;
      y = 0;
      alpha = 1;
      anchor = { set: () => {} };

      constructor(opts: { text?: string; style?: any }) {
        this._text = opts?.text ?? '';
        this.style = opts?.style ?? {};
      }
      get text(): string {
        return this._text;
      }
      set text(v: string) {
        this._text = v;
      }
      destroy(): void {}
    }

    class MockTextStyle {
      opts: any;
      constructor(opts?: any) {
        this.opts = opts;
        if (opts) {
          for (const key of Object.keys(opts)) {
            (this as any)[key] = opts[key];
          }
        }
      }
    }

    return { MockContainer, MockGraphics, MockText, MockTextStyle };
  },
);

vi.mock('pixi.js', () => ({
  Container: MockContainer,
  Graphics: MockGraphics,
  Text: MockText,
  TextStyle: MockTextStyle,
}));

// ---------------------------------------------------------------------------
import { CombatFeedbackManager } from '../CombatFeedbackManager.js';

describe('CombatFeedbackManager', () => {
  let worldContainer: any;
  let manager: CombatFeedbackManager;

  beforeEach(() => {
    worldContainer = new MockContainer();
    manager = new CombatFeedbackManager(worldContainer);
  });

  it('should create two sub-containers on construction', () => {
    // The manager adds feedbackContainer and healthBarContainer
    expect(worldContainer.children.length).toBe(2);
  });

  it('should create damage number on entity damaged', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });

    // feedbackContainer should have the damage text
    const feedbackContainer = worldContainer.children[0];
    expect(feedbackContainer.children.length).toBe(1);
    expect(feedbackContainer.children[0].text).toBe('42');
  });

  it('should create health bar on entity damaged', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });

    // healthBarContainer should have the health bar
    const healthBarContainer = worldContainer.children[1];
    expect(healthBarContainer.children.length).toBe(1);
  });

  it('should update existing health bar on subsequent damage', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });

    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 10,
      isCritical: false,
      targetHp: 65,
      targetMaxHp: 100,
      x: 160,
      y: 200,
    });

    // Still only 1 health bar
    const healthBarContainer = worldContainer.children[1];
    expect(healthBarContainer.children.length).toBe(1);
  });

  it('should create separate health bars for different entities', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });
    manager.onEntityDamaged({
      targetId: 'monster-2',
      damage: 10,
      isCritical: false,
      targetHp: 90,
      targetMaxHp: 100,
      x: 300,
      y: 200,
    });

    const healthBarContainer = worldContainer.children[1];
    expect(healthBarContainer.children.length).toBe(2);
  });

  it('should remove health bar when entity is removed', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });

    expect(worldContainer.children[1].children.length).toBe(1);

    manager.removeEntity('monster-1');
    expect(worldContainer.children[1].children.length).toBe(0);
  });

  it('should update damage numbers each frame', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });

    const feedbackContainer = worldContainer.children[0];
    const text = feedbackContainer.children[0];
    const initialY = text.y;

    manager.update(0.5);
    expect(text.y).toBeLessThan(initialY); // drifted up
    expect(text.alpha).toBeLessThan(1); // faded
  });

  it('should remove dead damage numbers after update', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });

    const feedbackContainer = worldContainer.children[0];
    expect(feedbackContainer.children.length).toBe(1);

    // Advance past lifetime
    manager.update(2.0);
    expect(feedbackContainer.children.length).toBe(0);
  });

  it('should clear all damage numbers and health bars', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });
    manager.onEntityDamaged({
      targetId: 'monster-2',
      damage: 10,
      isCritical: true,
      targetHp: 90,
      targetMaxHp: 100,
      x: 300,
      y: 200,
    });

    manager.clear();
    expect(worldContainer.children[0].children.length).toBe(0);
    expect(worldContainer.children[1].children.length).toBe(0);
  });

  it('should update entity position on setPosition', () => {
    manager.onEntityDamaged({
      targetId: 'monster-1',
      damage: 42,
      isCritical: false,
      targetHp: 75,
      targetMaxHp: 100,
      x: 150,
      y: 200,
    });

    // Move entity to new position
    manager.updateEntityPosition('monster-1', 200, 300);

    const healthBarContainer = worldContainer.children[1];
    const barContainer = healthBarContainer.children[0];
    // x = 200 - 15 = 185, y = 300 - 8 = 292
    expect(barContainer.x).toBe(185);
    expect(barContainer.y).toBe(292);
  });
});
