import type { ITileMap, IPortal } from '@arcan-gods/shared';
import { CollisionGrid } from './CollisionGrid.js';
import { loadTilemap, buildCollisionGrid } from './TilemapLoader.js';
import { logger } from '../../utils/logger.js';

interface MapEntry {
  tilemap: ITileMap;
  grid: CollisionGrid;
}

const FALLBACK_WIDTH = 50;
const FALLBACK_HEIGHT = 40;

/**
 * Manages multiple tilemaps with lazy loading, caching, and fallback support.
 *
 * Provides collision grids, map data, spawn points, and portal detection
 * for all loaded maps.
 */
export class MapManager {
  private maps: Map<string, MapEntry> = new Map();

  /**
   * Loads a map by ID (or retrieves from cache if already loaded).
   * On failure, creates a fallback fully-walkable grid.
   *
   * @param mapId - The map identifier
   * @returns The CollisionGrid for the map
   */
  loadMap(mapId: string): CollisionGrid {
    const existing = this.maps.get(mapId);
    if (existing) return existing.grid;

    try {
      const tilemap = loadTilemap(mapId);
      const grid = buildCollisionGrid(tilemap);
      this.maps.set(mapId, { tilemap, grid });
      logger.info('Map loaded', { mapId, width: tilemap.width, height: tilemap.height });
      return grid;
    } catch (err) {
      logger.warn('Failed to load map, using fallback', {
        mapId,
        error: (err as Error).message,
      });
      return this.createFallback(mapId);
    }
  }

  /**
   * Returns the collision grid for a map, loading it if necessary.
   *
   * @param mapId - The map identifier
   */
  getGrid(mapId: string): CollisionGrid {
    const entry = this.maps.get(mapId);
    if (!entry) {
      return this.loadMap(mapId);
    }
    return entry.grid;
  }

  /**
   * Returns the full tilemap data for a map, loading it if necessary.
   *
   * @param mapId - The map identifier
   * @throws If the map cannot be loaded (no fallback)
   */
  getMapData(mapId: string): ITileMap {
    const entry = this.maps.get(mapId);
    if (!entry) {
      // Attempt to load it
      this.loadMap(mapId);
      const loaded = this.maps.get(mapId);
      if (!loaded) {
        throw new Error(`Map "${mapId}" could not be loaded and no fallback is available`);
      }
      return loaded.tilemap;
    }
    return entry.tilemap;
  }

  /**
   * Returns the default spawn point for a map.
   * Falls back to the center of the map if no spawn points are defined.
   *
   * @param mapId - The map identifier
   */
  getDefaultSpawn(mapId: string): { x: number; y: number } {
    const tilemap = this.getMapData(mapId);
    if (tilemap.spawnPoints.length > 0) {
      const sp = tilemap.spawnPoints[0];
      return { x: sp.x, y: sp.y };
    }
    // Center of map in pixels
    const cx = Math.floor((tilemap.width * tilemap.tileSize) / 2);
    const cy = Math.floor((tilemap.height * tilemap.tileSize) / 2);
    return { x: cx, y: cy };
  }

  /** Returns the list of currently loaded map IDs. */
  getLoadedMaps(): string[] {
    return Array.from(this.maps.keys());
  }

  /**
   * Checks whether the given pixel coordinates are inside any portal zone
   * on the specified map.
   *
   * @param mapId - The map identifier
   * @param x - Pixel X coordinate
   * @param y - Pixel Y coordinate
   * @returns The portal if found, null otherwise
   */
  getPortalAt(mapId: string, x: number, y: number): IPortal | null {
    const tilemap = this.getMapData(mapId);
    for (const portal of tilemap.portals) {
      if (
        x >= portal.x &&
        x < portal.x + portal.width &&
        y >= portal.y &&
        y < portal.y + portal.height
      ) {
        return portal;
      }
    }
    return null;
  }

  // ---- Private helpers ----

  private createFallback(mapId: string): CollisionGrid {
    const data: boolean[][] = [];
    for (let y = 0; y < FALLBACK_HEIGHT; y++) {
      data[y] = [];
      for (let x = 0; x < FALLBACK_WIDTH; x++) {
        data[y][x] = true;
      }
    }
    const grid = new CollisionGrid(data);

    const fallbackTilemap: ITileMap = {
      id: mapId,
      width: FALLBACK_WIDTH,
      height: FALLBACK_HEIGHT,
      tileSize: 32,
      layers: [],
      tilesets: [],
      spawnPoints: [{ x: 400, y: 320, mapId }],
      portals: [],
    };

    this.maps.set(mapId, { tilemap: fallbackTilemap, grid });
    return grid;
  }
}
