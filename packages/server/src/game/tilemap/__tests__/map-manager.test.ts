import { describe, it, expect, beforeEach } from 'vitest';
import { MapManager } from '../MapManager.js';

describe('MapManager', () => {
  let mapManager: MapManager;

  beforeEach(() => {
    mapManager = new MapManager();
  });

  describe('loadMap', () => {
    it('should load an existing map', () => {
      const grid = mapManager.loadMap('lorencia');
      expect(grid).toBeDefined();
      expect(grid.getWidth()).toBe(50);
      expect(grid.getHeight()).toBe(40);
    });

    it('should return the same cached instance on subsequent loads', () => {
      const grid1 = mapManager.loadMap('lorencia');
      const grid2 = mapManager.loadMap('lorencia');
      expect(grid1).toBe(grid2);
    });

    it('should create a fallback grid for non-existent maps', () => {
      const grid = mapManager.loadMap('non_existent_map');
      expect(grid).toBeDefined();
      // Fallback is 50x40 fully walkable
      expect(grid.getWidth()).toBe(50);
      expect(grid.getHeight()).toBe(40);
      expect(grid.isWalkable(0, 0)).toBe(true);
      expect(grid.isWalkable(49, 39)).toBe(true);
    });
  });

  describe('getGrid', () => {
    it('should load and return the grid if not yet loaded', () => {
      const grid = mapManager.getGrid('lorencia');
      expect(grid).toBeDefined();
      expect(grid.getWidth()).toBe(50);
    });

    it('should return cached grid on subsequent calls', () => {
      const grid1 = mapManager.getGrid('lorencia');
      const grid2 = mapManager.getGrid('lorencia');
      expect(grid1).toBe(grid2);
    });

    it('should fallback for non-existent map', () => {
      const grid = mapManager.getGrid('unknown_map_xyz');
      expect(grid).toBeDefined();
      expect(grid.getWidth()).toBe(50);
      expect(grid.isWalkable(0, 0)).toBe(true);
    });
  });

  describe('getMapData', () => {
    it('should return tilemap data for an existing map', () => {
      const tilemap = mapManager.getMapData('lorencia');
      expect(tilemap).toBeDefined();
      expect(tilemap.id).toBe('lorencia');
      expect(tilemap.width).toBe(50);
      expect(tilemap.height).toBe(40);
      expect(tilemap.tileSize).toBe(32);
    });

    it('should return fallback tilemap for non-existent map', () => {
      const tilemap = mapManager.getMapData('missing_map');
      expect(tilemap).toBeDefined();
      expect(tilemap.id).toBe('missing_map');
      expect(tilemap.width).toBe(50);
      expect(tilemap.height).toBe(40);
    });
  });

  describe('getDefaultSpawn', () => {
    it('should return the first spawn point from the map', () => {
      const spawn = mapManager.getDefaultSpawn('lorencia');
      expect(spawn).toBeDefined();
      // Lorencia has a spawn at (800, 640)
      expect(spawn.x).toBe(800);
      expect(spawn.y).toBe(640);
    });

    it('should return center fallback for map with no spawn points', () => {
      // Force load a map that doesn't exist to get fallback
      const mgr = new MapManager();
      mgr.getMapData('fallback_test');
      // The fallback spawn point should be defined
      const spawn = mgr.getDefaultSpawn('fallback_test');
      expect(spawn).toBeDefined();
      expect(typeof spawn.x).toBe('number');
      expect(typeof spawn.y).toBe('number');
    });
  });

  describe('getLoadedMaps', () => {
    it('should start empty', () => {
      expect(mapManager.getLoadedMaps()).toHaveLength(0);
    });

    it('should list loaded maps after loading', () => {
      mapManager.loadMap('lorencia');
      const loaded = mapManager.getLoadedMaps();
      expect(loaded).toContain('lorencia');
      expect(loaded).toHaveLength(1);
    });

    it('should include fallback maps', () => {
      mapManager.loadMap('some_map');
      expect(mapManager.getLoadedMaps()).toContain('some_map');
    });
  });

  describe('getPortalAt', () => {
    beforeEach(() => {
      mapManager.loadMap('lorencia');
    });

    it('should find the Devias portal at (1216, 576)', () => {
      const portal = mapManager.getPortalAt('lorencia', 1216, 576);
      expect(portal).not.toBeNull();
      expect(portal!.targetMap).toBe('devias');
      expect(portal!.targetX).toBe(100);
      expect(portal!.targetY).toBe(100);
    });

    it('should find the Noria portal at (384, 1248)', () => {
      const portal = mapManager.getPortalAt('lorencia', 384, 1248);
      expect(portal).not.toBeNull();
      expect(portal!.targetMap).toBe('noria');
    });

    it('should detect portal entry at multiple points within the zone', () => {
      // Devias portal: x=1216, y=576, w=32, h=64
      // Bottom-right corner
      const portal = mapManager.getPortalAt('lorencia', 1247, 639);
      expect(portal).not.toBeNull();
      expect(portal!.targetMap).toBe('devias');
    });

    it('should return null for coordinates outside any portal zone', () => {
      const portal = mapManager.getPortalAt('lorencia', 0, 0);
      expect(portal).toBeNull();
    });

    it('should return null for coordinates just outside portal boundaries', () => {
      // Just left of Devias portal
      expect(mapManager.getPortalAt('lorencia', 1215, 600)).toBeNull();
      // Just above Devias portal
      expect(mapManager.getPortalAt('lorencia', 1220, 575)).toBeNull();
      // Just right of Devias portal
      expect(mapManager.getPortalAt('lorencia', 1248, 600)).toBeNull();
    });

    it('should handle non-existent maps gracefully', () => {
      // Loading the non-existent map will trigger fallback which has no portals
      const portal = mapManager.getPortalAt('void_map', 0, 0);
      expect(portal).toBeNull();
    });
  });

  describe('integration: lorencia collision grid', () => {
    it('should have walls on borders (except portal openings)', () => {
      const grid = mapManager.loadMap('lorencia');

      // Top border
      expect(grid.isWalkable(0, 0)).toBe(false);
      expect(grid.isWalkable(25, 0)).toBe(false);
      expect(grid.isWalkable(49, 0)).toBe(false);

      // Bottom border (portal opening at tiles 12-13)
      expect(grid.isWalkable(0, 39)).toBe(false);
      expect(grid.isWalkable(12, 39)).toBe(true); // portal opening
      expect(grid.isWalkable(13, 39)).toBe(true); // portal opening
      expect(grid.isWalkable(20, 39)).toBe(false);

      // Left border
      expect(grid.isWalkable(0, 10)).toBe(false);
      expect(grid.isWalkable(0, 20)).toBe(false);

      // Right border (portal opening at tiles y=18,19)
      expect(grid.isWalkable(49, 10)).toBe(false);
      expect(grid.isWalkable(49, 18)).toBe(true); // portal opening
      expect(grid.isWalkable(49, 19)).toBe(true); // portal opening
      expect(grid.isWalkable(49, 30)).toBe(false);
    });

    it('should have walkable areas in the center', () => {
      const grid = mapManager.loadMap('lorencia');
      expect(grid.isWalkable(25, 20)).toBe(true);
      expect(grid.isWalkable(30, 15)).toBe(true);
      expect(grid.isWalkable(15, 25)).toBe(true);
    });

    it('should have blocked tiles at pillar positions', () => {
      const grid = mapManager.loadMap('lorencia');
      // 2x2 pillar at (8,6)-(9,7)
      expect(grid.isWalkable(8, 6)).toBe(false);
      expect(grid.isWalkable(9, 7)).toBe(false);
      // 2x2 pillar at (10,28)-(11,29)
      expect(grid.isWalkable(10, 28)).toBe(false);
      expect(grid.isWalkable(11, 29)).toBe(false);
    });
  });
});
