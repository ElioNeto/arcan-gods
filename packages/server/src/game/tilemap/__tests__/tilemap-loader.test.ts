import { describe, it, expect } from 'vitest';
import { parseTilemap, buildCollisionGrid } from '../TilemapLoader.js';

describe('TilemapLoader', () => {
  describe('parseTilemap', () => {
    it('should parse a minimal Tiled JSON into ITileMap', () => {
      const json = {
        width: 10,
        height: 8,
        tileWidth: 32,
        tileHeight: 32,
        layers: [
          { name: 'ground', type: 'tilelayer', data: [], visible: true },
        ],
      };

      const tilemap = parseTilemap(json, 'test_map');

      expect(tilemap.id).toBe('test_map');
      expect(tilemap.width).toBe(10);
      expect(tilemap.height).toBe(8);
      expect(tilemap.tileSize).toBe(32);
      expect(tilemap.layers).toHaveLength(1);
      expect(tilemap.layers[0].name).toBe('ground');
      expect(tilemap.tilesets).toEqual([]);
      expect(tilemap.portals).toEqual([]);
    });

    it('should generate a default spawn point at center if none provided', () => {
      const json = {
        width: 50,
        height: 40,
        tileWidth: 32,
        tileHeight: 32,
        layers: [],
      };

      const tilemap = parseTilemap(json, 'lorencia');
      expect(tilemap.spawnPoints).toHaveLength(1);
      expect(tilemap.spawnPoints[0].x).toBe(800); // center x = (50 * 32) / 2
      expect(tilemap.spawnPoints[0].y).toBe(640); // center y = (40 * 32) / 2
      expect(tilemap.spawnPoints[0].mapId).toBe('lorencia');
    });

    it('should parse portals correctly', () => {
      const json = {
        width: 50,
        height: 40,
        tileWidth: 32,
        tileHeight: 32,
        layers: [],
        portals: [
          {
            x: 100,
            y: 200,
            width: 32,
            height: 64,
            targetMap: 'devias',
            targetX: 50,
            targetY: 50,
            label: 'To Devias',
          },
        ],
      };

      const tilemap = parseTilemap(json, 'lorencia');
      expect(tilemap.portals).toHaveLength(1);
      expect(tilemap.portals[0].targetMap).toBe('devias');
      expect(tilemap.portals[0].x).toBe(100);
      expect(tilemap.portals[0].y).toBe(200);
      expect(tilemap.portals[0].label).toBe('To Devias');
    });

    it('should parse custom spawn points', () => {
      const json = {
        width: 50,
        height: 40,
        tileWidth: 32,
        tileHeight: 32,
        layers: [],
        spawnPoints: [
          { x: 500, y: 300, label: 'gate' },
          { x: 200, y: 200, label: 'temple' },
        ],
      };

      const tilemap = parseTilemap(json, 'lorencia');
      expect(tilemap.spawnPoints).toHaveLength(2);
      expect(tilemap.spawnPoints[0].x).toBe(500);
      expect(tilemap.spawnPoints[0].mapId).toBe('lorencia');
    });

    it('should use provided mapId when spawnPoints lack mapId', () => {
      const json = {
        width: 10,
        height: 10,
        tileWidth: 32,
        tileHeight: 32,
        layers: [],
        spawnPoints: [{ x: 100, y: 100 }],
      };

      const tilemap = parseTilemap(json, 'devias');
      expect(tilemap.spawnPoints[0].mapId).toBe('devias');
    });

    it('should fall back to "unknown" id when no id is provided', () => {
      const json = { width: 10, height: 10, tileWidth: 32, tileHeight: 32, layers: [] };
      const tilemap = parseTilemap(json);
      expect(tilemap.id).toBe('unknown');
    });

    it('should handle objectgroup layers', () => {
      const json = {
        width: 10,
        height: 10,
        tileWidth: 32,
        tileHeight: 32,
        layers: [
          {
            name: 'objects',
            type: 'objectgroup',
            visible: true,
            objects: [
              { id: 1, name: 'chest', type: 'interactive', x: 100, y: 200, width: 32, height: 32, visible: true },
            ],
          },
        ],
      };

      const tilemap = parseTilemap(json, 'test');
      expect(tilemap.layers).toHaveLength(1);
      expect(tilemap.layers[0].type).toBe('objectgroup');
      expect(tilemap.layers[0].objects).toHaveLength(1);
      expect(tilemap.layers[0].objects![0].name).toBe('chest');
    });
  });

  describe('buildCollisionGrid', () => {
    it('should create a fully walkable grid when no collision layer exists', () => {
      const tilemap = {
        id: 'test',
        width: 3,
        height: 3,
        tileSize: 32,
        layers: [
          { name: 'ground', type: 'tilelayer' as const, data: [], visible: true, opacity: 1 },
        ],
        tilesets: [],
        spawnPoints: [],
        portals: [],
      };

      const grid = buildCollisionGrid(tilemap);
      expect(grid.getWidth()).toBe(3);
      expect(grid.getHeight()).toBe(3);
      expect(grid.isWalkable(0, 0)).toBe(true);
      expect(grid.isWalkable(1, 1)).toBe(true);
      expect(grid.isWalkable(2, 2)).toBe(true);
    });

    it('should mark tiles with GID > 0 as blocked', () => {
      // 2x2 grid: collision layer data (1D array, row-major)
      // [0]=wall(1), [1]=walkable(0)
      // [2]=walkable(0), [3]=wall(1)
      const collisionData = [
        1, 0,  // row 0: (0,0) blocked, (1,0) walkable
        0, 1,  // row 1: (0,1) walkable, (1,1) blocked
      ];

      const tilemap = {
        id: 'test',
        width: 2,
        height: 2,
        tileSize: 32,
        layers: [
          { name: 'ground', type: 'tilelayer' as const, data: [], visible: true, opacity: 1 },
          { name: 'collision', type: 'tilelayer' as const, data: collisionData, visible: false, opacity: 1 },
        ],
        tilesets: [],
        spawnPoints: [],
        portals: [],
      };

      const grid = buildCollisionGrid(tilemap);
      expect(grid.isWalkable(0, 0)).toBe(false);
      expect(grid.isWalkable(1, 0)).toBe(true);
      expect(grid.isWalkable(0, 1)).toBe(true);
      expect(grid.isWalkable(1, 1)).toBe(false);
    });

    it('should use custom collision layer name', () => {
      const collisionData = [
        1, 0,
        0, 1,
      ];

      const tilemap = {
        id: 'test',
        width: 2,
        height: 2,
        tileSize: 32,
        layers: [
          { name: 'walls', type: 'tilelayer' as const, data: collisionData, visible: false, opacity: 1 },
        ],
        tilesets: [],
        spawnPoints: [],
        portals: [],
      };

      const grid = buildCollisionGrid(tilemap, 'walls');
      expect(grid.isWalkable(0, 0)).toBe(false);
      expect(grid.isWalkable(1, 1)).toBe(false);
      expect(grid.isWalkable(0, 1)).toBe(true);
    });

    it('should handle larger collision data correctly', () => {
      // 3x3 with walls on all edges
      const collisionData: number[] = [];
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          // Walls on border, walkable center
          if (y === 0 || y === 2 || x === 0 || x === 2) {
            collisionData.push(1);
          } else {
            collisionData.push(0);
          }
        }
      }

      const tilemap = {
        id: 'test',
        width: 3,
        height: 3,
        tileSize: 32,
        layers: [
          { name: 'collision', type: 'tilelayer' as const, data: collisionData, visible: false, opacity: 1 },
        ],
        tilesets: [],
        spawnPoints: [],
        portals: [],
      };

      const grid = buildCollisionGrid(tilemap);
      // Walls on edges
      expect(grid.isWalkable(0, 0)).toBe(false);
      expect(grid.isWalkable(1, 0)).toBe(false);
      expect(grid.isWalkable(2, 0)).toBe(false);
      expect(grid.isWalkable(0, 1)).toBe(false);
      expect(grid.isWalkable(2, 1)).toBe(false);
      expect(grid.isWalkable(0, 2)).toBe(false);
      expect(grid.isWalkable(1, 2)).toBe(false);
      expect(grid.isWalkable(2, 2)).toBe(false);
      // Center is walkable
      expect(grid.isWalkable(1, 1)).toBe(true);
    });

    it('should treat undefined collision layer as fully walkable', () => {
      const tilemap = {
        id: 'test',
        width: 2,
        height: 2,
        tileSize: 32,
        layers: [],
        tilesets: [],
        spawnPoints: [],
        portals: [],
      };

      const grid = buildCollisionGrid(tilemap);
      expect(grid.isWalkable(0, 0)).toBe(true);
      expect(grid.isWalkable(1, 1)).toBe(true);
    });
  });
});
