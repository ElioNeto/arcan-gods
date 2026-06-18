import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ITileMap, ITileLayer, IPortal, ISpawnPoint } from '@arcan-gods/shared';
import { CollisionGrid } from './CollisionGrid.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MAPS_DIR = join(__dirname, 'maps');

/**
 * Loads a Tiled JSON map from the maps directory and returns an ITileMap.
 * @param mapId - The map identifier (filename without .json extension)
 * @throws If the map file cannot be found or parsed
 */
export function loadTilemap(mapId: string): ITileMap {
  const filePath = join(MAPS_DIR, `${mapId}.json`);
  const raw = readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(raw);
  return parseTilemap(jsonData, mapId);
}

/**
 * Converts a raw Tiled JSON object into an ITileMap.
 * Handles both Tiled Editor export format and simplified mock format.
 *
 * @param jsonData - The parsed JSON data from a Tiled map file
 * @param mapId - Optional map ID override (used when the JSON lacks an 'id' field)
 */
export function parseTilemap(jsonData: Record<string, unknown>, mapId?: string): ITileMap {
  const layers: ITileLayer[] = (jsonData.layers as any[] | undefined)?.map((layer: any) => ({
    name: layer.name,
    type: layer.type || 'tilelayer',
    data: layer.data,
    visible: layer.visible !== undefined ? layer.visible : true,
    opacity: layer.opacity ?? 1,
    objects: layer.objects,
  })) ?? [];

  const portals: IPortal[] = (jsonData.portals as any[] | undefined)?.map((p: any) => ({
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    targetMap: p.targetMap,
    targetX: p.targetX,
    targetY: p.targetY,
    label: p.label,
  })) ?? [];

  const spawnPoints: ISpawnPoint[] = (jsonData.spawnPoints as any[] | undefined)?.map((sp: any) => ({
    x: sp.x,
    y: sp.y,
    mapId: sp.mapId || mapId || 'unknown',
    label: sp.label,
  })) ?? [];

  // Provide a default spawn point at the center of the map if none defined
  if (spawnPoints.length === 0) {
    const tileSize = (jsonData.tileWidth as number) || (jsonData.tileHeight as number) || 32;
    spawnPoints.push({
      x: Math.floor(((jsonData.width as number) * tileSize) / 2),
      y: Math.floor(((jsonData.height as number) * tileSize) / 2),
      mapId: mapId || 'unknown',
    });
  }

  return {
    id: mapId || (jsonData.id as string) || 'unknown',
    width: jsonData.width as number,
    height: jsonData.height as number,
    tileSize: (jsonData.tileWidth as number) || (jsonData.tileHeight as number) || 32,
    layers,
    tilesets: (jsonData.tilesets as any[]) ?? [],
    spawnPoints,
    portals,
  };
}

/**
 * Builds a CollisionGrid from a tilemap's collision layer.
 *
 * Tiles with GID > 0 in the collision layer are treated as blocked (non-walkable).
 * Tiles with GID = 0 (no tile) are walkable.
 * If the specified collision layer is not found, the entire grid defaults to walkable.
 *
 * @param tilemap - The parsed tilemap
 * @param collisionLayerName - Name of the layer to use for collision data (default: 'collision')
 */
export function buildCollisionGrid(tilemap: ITileMap, collisionLayerName: string = 'collision'): CollisionGrid {
  // Default all tiles to walkable
  const grid: boolean[][] = [];
  for (let y = 0; y < tilemap.height; y++) {
    grid[y] = [];
    for (let x = 0; x < tilemap.width; x++) {
      grid[y][x] = true;
    }
  }

  const collisionLayer = tilemap.layers.find(
    (l) => l.name === collisionLayerName && l.type === 'tilelayer' && l.data,
  );

  if (collisionLayer?.data) {
    for (let y = 0; y < tilemap.height; y++) {
      for (let x = 0; x < tilemap.width; x++) {
        const gid = collisionLayer.data[y * tilemap.width + x];
        // Any non-zero GID means a tile is placed there → blocked
        if (gid && gid > 0) {
          grid[y][x] = false;
        }
      }
    }
  }

  return new CollisionGrid(grid);
}
