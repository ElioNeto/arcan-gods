import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock classes must be created with vi.hoisted() because vi.mock factory is hoisted
const { MockContainer, MockGraphics } = vi.hoisted(() => {
  class MockContainer {
    children: any[] = [];
    addChild(child: any): void {
      this.children.push(child);
    }
    removeChild(child: any): void {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
    }
    destroy(): void {
      this.children = [];
    }
  }

  class MockGraphics {
    private _destroyed = false;
    rect(_x: number, _y: number, _w: number, _h: number): this {
      return this;
    }
    circle(_x: number, _y: number, _r: number): this {
      return this;
    }
    fill(_options: { color: number; alpha?: number }): this {
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

import { TilemapRenderer } from '../maps/TilemapRenderer.js';

describe('TilemapRenderer', () => {
  let container: any;
  let renderer: TilemapRenderer;

  beforeEach(() => {
    container = new MockContainer();
    renderer = new TilemapRenderer(container as any, 32);
  });

  it('should create with default tile size', () => {
    const r = new TilemapRenderer(new MockContainer() as any);
    expect(r.getTileSize()).toBe(32);
  });

  it('should create with custom tile size', () => {
    const r = new TilemapRenderer(new MockContainer() as any, 64);
    expect(r.getTileSize()).toBe(64);
  });

  it('should render a 3x3 all-walkable grid (3 layers)', () => {
    const grid: boolean[][] = [
      [true, true, true],
      [true, true, true],
      [true, true, true],
    ];
    renderer.renderCollisionGrid(grid);
    // Now creates 3 Graphics objects: ground + decor + path
    expect(container.children.length).toBe(3);
  });

  it('should render a mixed grid with both walkable and blocked tiles (3 layers)', () => {
    const grid: boolean[][] = [
      [true, false],
      [false, true],
    ];
    renderer.renderCollisionGrid(grid);
    expect(container.children.length).toBe(3);
  });

  it('should handle empty grid', () => {
    renderer.renderCollisionGrid([]);
    expect(container.children.length).toBe(0);
  });

  it('should render from map data (3 layers)', () => {
    const mapData = {
      width: 2,
      height: 2,
      tileSize: 32,
      collisionGrid: [
        [true, false],
        [false, true],
      ],
    };
    renderer.renderFromMapData(mapData);
    expect(container.children.length).toBe(3);
  });

  it('getTileSize should return correct value', () => {
    expect(renderer.getTileSize()).toBe(32);
  });

  it('clear should destroy all graphics objects', () => {
    const grid: boolean[][] = [
      [true, true],
      [true, true],
    ];
    renderer.renderCollisionGrid(grid);
    const childrenBefore = container.children.length;
    expect(childrenBefore).toBeGreaterThan(0);

    renderer.clear();
    expect(container.children.length).toBe(0);
  });

  it('renderFromMapData with empty grid should produce no tiles', () => {
    renderer.renderFromMapData({
      width: 0,
      height: 0,
      collisionGrid: [],
    });
    expect(container.children.length).toBe(0);
  });
});
