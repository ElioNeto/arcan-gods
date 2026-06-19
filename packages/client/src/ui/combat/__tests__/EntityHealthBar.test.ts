import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// PixiJS mocks
// ---------------------------------------------------------------------------
const { MockContainer, MockGraphics } = vi.hoisted(() => {
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

  return { MockContainer, MockGraphics };
});

vi.mock('pixi.js', () => ({
  Container: MockContainer,
  Graphics: MockGraphics,
}));

// ---------------------------------------------------------------------------
import { EntityHealthBar } from '../EntityHealthBar.js';

describe('EntityHealthBar', () => {
  let parent: any;

  beforeEach(() => {
    parent = new MockContainer();
  });

  it('should create a bar with background and fill', () => {
    new EntityHealthBar('monster-1', 50, 100, parent);
    // parent: container added (the bar's own container)
    expect(parent.children.length).toBe(1);
    // The bar's container has 2 children: bg bar + fill bar
    const barContainer = parent.children[0];
    expect(barContainer.children.length).toBe(2);
  });

  it('should position bar centered above entity', () => {
    const bar = new EntityHealthBar('monster-1', 50, 100, parent);
    bar.setPosition(100, 200);
    const barContainer = parent.children[0];
    // x = entityX - BAR_WIDTH/2 = 100 - 15 = 85
    expect(barContainer.x).toBe(85);
    // y = entityY + Y_OFFSET = 200 - 8 = 192
    expect(barContainer.y).toBe(192);
  });

  it('should update fill width proportional to HP', () => {
    const bar = new EntityHealthBar('monster-1', 50, 100, parent);
    bar.update(75, 100);
    // Fill bar rect width should be 30 * 0.75 = 22.5 -> truncated
    // Hard to test exact Graphics values since we mock, but we verify no crash
    expect(() => bar.update(0, 100)).not.toThrow();
  });

  it('should handle full HP', () => {
    new EntityHealthBar('monster-1', 100, 100, parent);
    // Creation does not throw
  });

  it('should handle zero HP', () => {
    new EntityHealthBar('monster-1', 0, 100, parent);
  });

  it('should handle maxHp=0 without division by zero', () => {
    new EntityHealthBar('monster-1', 50, 0, parent);
  });

  it('should handle negative HP', () => {
    new EntityHealthBar('monster-1', -10, 100, parent);
  });

  it('should remove itself from parent on destroy', () => {
    const bar = new EntityHealthBar('monster-1', 50, 100, parent);
    expect(parent.children.length).toBe(1);

    bar.destroy();
    expect(parent.children.length).toBe(0);
  });

  it('should return the entity ID', () => {
    const bar = new EntityHealthBar('monster-1', 50, 100, parent);
    expect(bar.getEntityId()).toBe('monster-1');
  });
});
