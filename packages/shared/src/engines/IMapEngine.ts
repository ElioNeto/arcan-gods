/**
 * Map Engine Interface (#67)
 *
 * Defines the contract for map loading, collision detection, portals,
 * spawn points, and the map editor tool.
 *
 * Implementations: server/src/engines/MapEngine.ts (server-side logic)
 * This interface is pure — NO runtime dependencies.
 */

import type { ISpawnPoint, IPortal, IMapData } from '../types/tilemap.js';

// ─── Engine-specific extensions ───────────────────────────────────

/** Extended layer info for engine rendering */
export interface ITileRenderLayerInfo {
  name: string;
  type: 'ground' | 'walls' | 'decoration' | 'effects';
  visible: boolean;
  opacity: number;
}

/** Extended portal with identifier and requirements */
export interface IPortalDef extends IPortal {
  id: string;
  minLevel?: number;
  direction?: string;
}

/** Weather and ambient effects */
export type WeatherType = 'none' | 'rain' | 'snow' | 'fog';

/** Full map descriptor combining tile data + engine config */
export interface IMapDescriptor {
  mapData: IMapData;
  displayName: string;
  layers: ITileRenderLayerInfo[];
  portals: IPortalDef[];
  spawnPoints: ISpawnPoint[];
  ambientMusic?: string;
  backgroundColor?: number;
  weather?: WeatherType;
}

// ─── Editor Types ─────────────────────────────────────────────────

export interface IMapEditor {
  createMap(id: string, width: number, height: number): IMapDescriptor;
  editTile(mapId: string, x: number, y: number, layerName: string, gid: number): void;
  addPortal(mapId: string, portal: IPortalDef): void;
  removePortal(mapId: string, portalId: string): void;
  addSpawnPoint(mapId: string, spawn: ISpawnPoint): void;
  removeSpawnPoint(mapId: string, spawnIndex: number): void;
  paintArea(mapId: string, layerName: string, gid: number, startX: number, startY: number, endX: number, endY: number): void;
  exportMap(mapId: string): IMapDescriptor;
  saveMap(mapId: string, filePath?: string): Promise<boolean>;
  loadMapFromFile(filePath: string): Promise<IMapDescriptor>;
}

// ─── Engine Interface ─────────────────────────────────────────────

export interface IMapEngine {
  // Lifecycle
  init(): Promise<void>;
  destroy(): void;

  // Loading
  loadMap(mapId: string): Promise<IMapData>;
  getMap(mapId: string): IMapData | undefined;
  getMapDescriptor(mapId: string): IMapDescriptor | undefined;
  unloadMap(mapId: string): void;
  getLoadedMaps(): string[];
  isMapLoaded(mapId: string): boolean;

  // Collision
  isInBounds(mapId: string, x: number, y: number): boolean;
  isWalkable(mapId: string, x: number, y: number): boolean;
  getCollisionGrid(mapId: string): boolean[][] | undefined;

  // Portals
  getPortalAt(mapId: string, x: number, y: number): IPortalDef | null;
  getPortals(mapId: string): IPortalDef[];
  getTargetMap(portal: IPortalDef): string;
  getTargetPosition(portal: IPortalDef): { x: number; y: number };

  // Spawn points
  getDefaultSpawn(mapId: string): { x: number; y: number };
  getSpawnPoints(mapId: string): ISpawnPoint[];

  // Events
  onPlayerEnterMap(playerId: string, mapId: string): void;
  onPlayerLeaveMap(playerId: string, mapId: string): void;

  // Editor (standalone tool)
  getEditor(): IMapEditor;

  // Update
  update(deltaMs: number): void;
}
