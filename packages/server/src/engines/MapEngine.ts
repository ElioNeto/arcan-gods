/**
 * Map Engine — server implementation (#67)
 *
 * Gerencia carregamento de mapas, colisão, portais, spawn points.
 *
 * Implementa IMapEngine de shared/.
 */

import type { IMapEngine, IMapData, IMapDescriptor, IPortalDef, IMapEditor } from '@arcan-gods/shared';
import type { ISpawnPoint } from '@arcan-gods/shared';

export class MapEngine implements IMapEngine {
  private maps: Map<string, IMapData> = new Map();
  private descriptors: Map<string, IMapDescriptor> = new Map();

  async init(): Promise<void> {
    // Maps are loaded on demand
  }

  destroy(): void {
    this.maps.clear();
    this.descriptors.clear();
  }

  // ─── Loading ────────────────────────────────────────────────

  async loadMap(mapId: string): Promise<IMapData> {
    const existing = this.maps.get(mapId);
    if (existing) return existing;

    // Create default map data for unknown maps
    const mapData: IMapData = this.createDefaultMap(mapId);
    this.maps.set(mapId, mapData);

    const descriptor: IMapDescriptor = {
      mapData,
      displayName: mapId.charAt(0).toUpperCase() + mapId.slice(1),
      layers: [
        { name: 'ground', type: 'ground', visible: true, opacity: 1 },
        { name: 'walls', type: 'walls', visible: true, opacity: 1 },
      ],
      portals: [],
      spawnPoints: [{ x: 25, y: 20, mapId }],
      backgroundColor: 0x0a0a1a,
    };
    this.descriptors.set(mapId, descriptor);

    return mapData;
  }

  getMap(mapId: string): IMapData | undefined {
    return this.maps.get(mapId);
  }

  getMapDescriptor(mapId: string): IMapDescriptor | undefined {
    return this.descriptors.get(mapId);
  }

  unloadMap(mapId: string): void {
    this.maps.delete(mapId);
    this.descriptors.delete(mapId);
  }

  getLoadedMaps(): string[] {
    return Array.from(this.maps.keys());
  }

  isMapLoaded(mapId: string): boolean {
    return this.maps.has(mapId);
  }

  // ─── Collision ──────────────────────────────────────────────

  isInBounds(mapId: string, x: number, y: number): boolean {
    const map = this.maps.get(mapId);
    if (!map) return false;
    return x >= 0 && x < map.width && y >= 0 && y < map.height;
  }

  isWalkable(mapId: string, x: number, y: number): boolean {
    if (!this.isInBounds(mapId, x, y)) return false;
    const map = this.maps.get(mapId)!;
    return !map.collisionGrid[y]?.[x];
  }

  getCollisionGrid(mapId: string): boolean[][] | undefined {
    return this.maps.get(mapId)?.collisionGrid;
  }

  // ─── Portals ────────────────────────────────────────────────

  getPortalAt(mapId: string, x: number, y: number): IPortalDef | null {
    const descriptor = this.descriptors.get(mapId);
    if (!descriptor) return null;
    return descriptor.portals.find(p =>
      x >= p.x && x < p.x + p.width &&
      y >= p.y && y < p.y + p.height
    ) ?? null;
  }

  getPortals(mapId: string): IPortalDef[] {
    return this.descriptors.get(mapId)?.portals ?? [];
  }

  getTargetMap(portal: IPortalDef): string {
    return portal.targetMap;
  }

  getTargetPosition(portal: IPortalDef): { x: number; y: number } {
    return { x: portal.targetX, y: portal.targetY };
  }

  // ─── Spawn Points ──────────────────────────────────────────

  getDefaultSpawn(mapId: string): { x: number; y: number } {
    const descriptor = this.descriptors.get(mapId);
    if (!descriptor || descriptor.spawnPoints.length === 0) {
      return { x: 25, y: 20 };
    }
    return { x: descriptor.spawnPoints[0].x, y: descriptor.spawnPoints[0].y };
  }

  getSpawnPoints(mapId: string): ISpawnPoint[] {
    return this.descriptors.get(mapId)?.spawnPoints ?? [];
  }

  // ─── Events ────────────────────────────────────────────────

  onPlayerEnterMap(_playerId: string, _mapId: string): void {
    // Future: trigger map events
  }

  onPlayerLeaveMap(_playerId: string, _mapId: string): void {
    // Future: cleanup
  }

  // ─── Editor ─────────────────────────────────────────────────

  getEditor(): IMapEditor {
    return {
      createMap: (id, w, h) => this.createEditorMap(id, w, h),
      editTile: (_mapId, _x, _y, _layer, _gid) => {},
      addPortal: (mapId, portal) => {
        const desc = this.descriptors.get(mapId);
        desc?.portals.push(portal);
      },
      removePortal: (mapId, portalId) => {
        const desc = this.descriptors.get(mapId);
        if (desc) desc.portals = desc.portals.filter(p => p.id !== portalId);
      },
      addSpawnPoint: (mapId, spawn) => {
        const desc = this.descriptors.get(mapId);
        desc?.spawnPoints.push(spawn);
      },
      removeSpawnPoint: (mapId, index) => {
        const desc = this.descriptors.get(mapId);
        if (desc) desc.spawnPoints.splice(index, 1);
      },
      paintArea: () => {},
      exportMap: (mapId) => this.descriptors.get(mapId)!,
      saveMap: async () => true,
      loadMapFromFile: async () => this.createEditorMap('default', 50, 40),
    };
  }

  // ─── Update ─────────────────────────────────────────────────

  update(_deltaMs: number): void {
    // Future: animated tiles, weather, etc.
  }

  // ─── Private ────────────────────────────────────────────────

  private createDefaultMap(mapId: string): IMapData {
    const w = 50;
    const h = 40;
    const grid: boolean[][] = [];
    for (let y = 0; y < h; y++) {
      grid[y] = [];
      for (let x = 0; x < w; x++) {
        grid[y][x] = false; // all walkable by default
      }
    }
    return {
      mapId,
      width: w,
      height: h,
      tileSize: 32,
      layers: [],
      collisionGrid: grid,
    };
  }

  private createEditorMap(id: string, w: number, h: number): IMapDescriptor {
    const grid: boolean[][] = [];
    for (let y = 0; y < h; y++) {
      grid[y] = [];
      for (let x = 0; x < w; x++) {
        grid[y][x] = false;
      }
    }
    return {
      mapData: { mapId: id, width: w, height: h, tileSize: 32, layers: [], collisionGrid: grid },
      displayName: id,
      layers: [],
      portals: [],
      spawnPoints: [],
    };
  }
}
