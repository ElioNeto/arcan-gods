export interface ITileMap {
  id: string;
  width: number; // in tiles
  height: number; // in tiles
  tileSize: number;
  layers: ITileLayer[];
  tilesets: ITileSet[];
  spawnPoints: ISpawnPoint[];
  portals: IPortal[];
}

export interface ITileLayer {
  name: string;
  type: 'tilelayer' | 'objectgroup';
  data?: number[]; // tile GIDs for tilelayer
  visible: boolean;
  opacity: number;
  objects?: ITileObject[];
}

export interface ITileObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  properties?: Record<string, string | number | boolean>;
}

export interface ITileSet {
  firstGid: number;
  name: string;
  tileWidth: number;
  tileHeight: number;
  image: string;
  imageWidth: number;
  imageHeight: number;
  tileCount: number;
  columns: number;
}

export interface ISpawnPoint {
  x: number;
  y: number;
  mapId: string;
  label?: string;
}

export interface IPortal {
  x: number;
  y: number;
  width: number;
  height: number;
  targetMap: string;
  targetX: number;
  targetY: number;
  label?: string;
}

export interface ICollisionGrid {
  width: number;
  height: number;
  data: boolean[][]; // true = walkable, false = blocked
}

export interface IMapData {
  mapId: string;
  width: number;
  height: number;
  tileSize: number;
  layers: ITileLayer[];
  collisionGrid: boolean[][];
}
