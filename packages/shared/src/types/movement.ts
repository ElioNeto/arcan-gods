export interface Waypoint {
  x: number;
  y: number;
}

export interface MovementPath {
  waypoints: Waypoint[];
  totalDistance: number;
}

export interface MovementState {
  moving: boolean;
  path: Waypoint[];
  currentWaypointIndex: number;
  speed: number; // tiles per second
}

export interface PathRequest {
  mapId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface PathResult {
  found: boolean;
  path: Waypoint[];
  distance: number;
}
