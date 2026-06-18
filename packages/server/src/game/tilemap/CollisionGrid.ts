import type { ICollisionGrid } from '@arcan-gods/shared';

/**
 * Manages a boolean matrix of walkability for a tilemap.
 * Row-major order: data[y][x] — true = walkable, false = blocked.
 */
export class CollisionGrid {
  private data: boolean[][];
  private width: number;
  private height: number;

  constructor(data: boolean[][]) {
    this.data = data;
    this.height = data.length;
    this.width = data.length > 0 ? data[0].length : 0;
  }

  /**
   * Returns whether the tile at (x, y) is walkable.
   * Out-of-bounds coordinates are never walkable.
   */
  isWalkable(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    return this.data[y][x];
  }

  /**
   * Returns whether (x, y) is within the grid bounds.
   */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /** Returns the grid width in tiles. */
  getWidth(): number {
    return this.width;
  }

  /** Returns the grid height in tiles. */
  getHeight(): number {
    return this.height;
  }

  /**
   * Sets the walkability of a specific tile.
   * Silently ignores out-of-bounds coordinates.
   */
  setWalkable(x: number, y: number, walkable: boolean): void {
    if (!this.isInBounds(x, y)) return;
    this.data[y][x] = walkable;
  }

  /** Exports the grid as a plain ICollisionGrid object. */
  toICollisionGrid(): ICollisionGrid {
    return {
      width: this.width,
      height: this.height,
      data: this.data,
    };
  }
}
