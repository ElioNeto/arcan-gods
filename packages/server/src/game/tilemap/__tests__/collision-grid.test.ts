import { describe, it, expect } from 'vitest';
import { CollisionGrid } from '../CollisionGrid.js';

describe('CollisionGrid', () => {
  describe('constructor', () => {
    it('should create a grid from a 2D boolean array', () => {
      const data = [
        [true, true],
        [true, false],
      ];
      const grid = new CollisionGrid(data);
      expect(grid.getWidth()).toBe(2);
      expect(grid.getHeight()).toBe(2);
    });

    it('should handle empty grid', () => {
      const grid = new CollisionGrid([]);
      expect(grid.getWidth()).toBe(0);
      expect(grid.getHeight()).toBe(0);
      expect(grid.isWalkable(0, 0)).toBe(false);
    });
  });

  describe('isWalkable', () => {
    it('should return true for walkable tiles', () => {
      const data = [
        [true, false],
        [false, true],
      ];
      const grid = new CollisionGrid(data);
      expect(grid.isWalkable(0, 0)).toBe(true);
      expect(grid.isWalkable(1, 1)).toBe(true);
    });

    it('should return false for blocked tiles', () => {
      const data = [
        [true, false],
        [false, true],
      ];
      const grid = new CollisionGrid(data);
      expect(grid.isWalkable(1, 0)).toBe(false);
      expect(grid.isWalkable(0, 1)).toBe(false);
    });

    it('should return false for out-of-bounds coordinates', () => {
      const data = [[true, true], [true, true]];
      const grid = new CollisionGrid(data);

      // Negative coordinates
      expect(grid.isWalkable(-1, 0)).toBe(false);
      expect(grid.isWalkable(0, -1)).toBe(false);

      // Beyond width/height
      expect(grid.isWalkable(2, 0)).toBe(false);
      expect(grid.isWalkable(0, 2)).toBe(false);

      // Both out of bounds
      expect(grid.isWalkable(-1, -1)).toBe(false);
      expect(grid.isWalkable(10, 10)).toBe(false);
    });
  });

  describe('isInBounds', () => {
    it('should return true for valid coordinates', () => {
      const data = [[true, true, true], [true, true, true]];
      const grid = new CollisionGrid(data);

      expect(grid.isInBounds(0, 0)).toBe(true);
      expect(grid.isInBounds(2, 1)).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      const data = [[true, true], [true, true]];
      const grid = new CollisionGrid(data);

      expect(grid.isInBounds(-1, 0)).toBe(false);
      expect(grid.isInBounds(0, -1)).toBe(false);
      expect(grid.isInBounds(2, 0)).toBe(false);
      expect(grid.isInBounds(0, 2)).toBe(false);
    });
  });

  describe('getWidth / getHeight', () => {
    it('should return correct dimensions for rectangular grid', () => {
      const data = [
        [true, true, true],
        [true, true, true],
        [true, true, true],
        [true, true, true],
      ];
      const grid = new CollisionGrid(data);
      expect(grid.getWidth()).toBe(3);
      expect(grid.getHeight()).toBe(4);
    });

    it('should return correct dimensions for single row', () => {
      const data = [[true, false, true]];
      const grid = new CollisionGrid(data);
      expect(grid.getWidth()).toBe(3);
      expect(grid.getHeight()).toBe(1);
    });
  });

  describe('setWalkable', () => {
    it('should update a tile from walkable to blocked', () => {
      const data = [[true, true], [true, true]];
      const grid = new CollisionGrid(data);

      grid.setWalkable(0, 0, false);
      expect(grid.isWalkable(0, 0)).toBe(false);
    });

    it('should update a tile from blocked to walkable', () => {
      const data = [[false, true], [true, true]];
      const grid = new CollisionGrid(data);

      grid.setWalkable(0, 0, true);
      expect(grid.isWalkable(0, 0)).toBe(true);
    });

    it('should not modify grid for out-of-bounds coordinates', () => {
      const data = [[true, true], [true, true]];
      const grid = new CollisionGrid(data);

      grid.setWalkable(-1, 0, false);
      expect(grid.isWalkable(0, 0)).toBe(true);

      grid.setWalkable(0, 5, false);
      expect(grid.isWalkable(0, 0)).toBe(true);
    });
  });

  describe('toICollisionGrid', () => {
    it('should export the grid data as ICollisionGrid', () => {
      const data = [
        [true, false],
        [false, true],
      ];
      const grid = new CollisionGrid(data);
      const exported = grid.toICollisionGrid();

      expect(exported.width).toBe(2);
      expect(exported.height).toBe(2);
      expect(exported.data).toEqual(data);
    });
  });
});
