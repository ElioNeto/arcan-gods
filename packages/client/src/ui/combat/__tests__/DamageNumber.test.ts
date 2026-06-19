import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// PixiJS mocks
// ---------------------------------------------------------------------------
const { MockContainer, MockText, MockTextStyle } = vi.hoisted(() => {
  class MockContainer {
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
      // Forward all properties from opts onto the instance
      if (opts) {
        for (const key of Object.keys(opts)) {
          (this as any)[key] = opts[key];
        }
      }
    }
  }

  return { MockContainer, MockText, MockTextStyle };
});

vi.mock('pixi.js', () => ({
  Container: MockContainer,
  Text: MockText,
  TextStyle: MockTextStyle,
}));

// ---------------------------------------------------------------------------
import { DamageNumber } from '../DamageNumber.js';

describe('DamageNumber', () => {
  let container: any;

  beforeEach(() => {
    container = new MockContainer();
  });

  it('should create a Text with the damage value', () => {
    new DamageNumber(100, 200, 42, false, container);
    expect(container.children.length).toBe(1);
    const text = container.children[0];
    expect(text.text).toBe('42');
  });

  it('should use normal color and size for non-critical', () => {
    new DamageNumber(100, 200, 42, false, container);
    const text = container.children[0];
    expect(text.style.fill).toBe(0xff4444);
    expect(text.style.fontSize).toBe(14);
    expect(text.style.fontWeight).toBe('normal');
  });

  it('should use critical color and size for critical hits', () => {
    new DamageNumber(100, 200, 99, true, container);
    const text = container.children[0];
    expect(text.style.fill).toBe(0xffff44);
    expect(text.style.fontSize).toBe(18);
    expect(text.style.fontWeight).toBe('bold');
  });

  it('should start with alpha=1', () => {
    new DamageNumber(100, 200, 42, false, container);
    expect(container.children[0].alpha).toBe(1);
  });

  it('should drift upward over time', () => {
    const dn = new DamageNumber(100, 200, 42, false, container);
    const text = container.children[0];
    const initialY = text.y;

    // After 0.5s: drift = -30 * 0.5 = -15px
    dn.update(0.5);
    expect(text.y).toBeCloseTo(initialY - 15, 1);
  });

  it('should decrease alpha over time', () => {
    const dn = new DamageNumber(100, 200, 42, false, container);
    const text = container.children[0];

    dn.update(0.75); // 50% of lifetime
    expect(text.alpha).toBeCloseTo(0.5, 2);

    dn.update(0.75); // total 1.5s
    expect(text.alpha).toBe(0);
  });

  it('should be dead after lifetime expires', () => {
    const dn = new DamageNumber(100, 200, 42, false, container);
    expect(dn.isDead()).toBe(false);

    dn.update(1.5);
    expect(dn.isDead()).toBe(true);
  });

  it('should not be dead before lifetime expires', () => {
    const dn = new DamageNumber(100, 200, 42, false, container);
    dn.update(1.0);
    expect(dn.isDead()).toBe(false);
  });

  it('should remove text from container on destroy', () => {
    const dn = new DamageNumber(100, 200, 42, false, container);
    expect(container.children.length).toBe(1);

    dn.destroy();
    expect(container.children.length).toBe(0);
  });

  it('should handle zero damage', () => {
    new DamageNumber(100, 200, 0, false, container);
    expect(container.children[0].text).toBe('0');
  });

  it('should handle large damage numbers', () => {
    new DamageNumber(100, 200, 12345, false, container);
    expect(container.children[0].text).toBe('12345');
  });
});
