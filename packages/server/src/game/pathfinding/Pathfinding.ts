import type { Waypoint } from '@arcan-gods/shared';
import { BinaryHeap } from './BinaryHeap.js';

/**
 * Node used internally by the A* algorithm.
 */
export interface PathNode {
  x: number;
  y: number;
  g: number; // cost from start
  h: number; // heuristic to end
  f: number; // g + h
  score: number; // alias for f, used by BinaryHeap
  parent: PathNode | null;
}

/**
 * Minimal grid interface required by findPath.
 * Implemented by CollisionGrid and MockGrid.
 */
export interface Grid {
  isWalkable(x: number, y: number): boolean;
  getWidth(): number;
  getHeight(): number;
}

/** 4-directional movement deltas: right, left, down, up */
const DIRS: ReadonlyArray<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Heuristic: Manhattan distance.
 */
function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/**
 * Reconstructs the path from the goal node back to the start.
 * Returns waypoints from start (inclusive) to end (inclusive).
 */
function reconstructPath(node: PathNode): Waypoint[] {
  const path: Waypoint[] = [];
  let current: PathNode | null = node;
  while (current) {
    path.push({ x: current.x, y: current.y });
    current = current.parent;
  }
  path.reverse();
  return path;
}

/**
 * A* pathfinding algorithm.
 *
 * @param grid  The collision grid (must implement isWalkable, getWidth, getHeight).
 * @param startX  Tile x of origin.
 * @param startY  Tile y of origin.
 * @param endX    Tile x of destination.
 * @param endY    Tile y of destination.
 * @returns An array of Waypoints from start to end (both inclusive), or an empty array if no path exists.
 *
 * - Uses Manhattan distance heuristic.
 * - 4-directional movement (no diagonals).
 * - G-cost = 1 per tile.
 * - BinaryHeap for the open set.
 * - Returns [] if the destination is not walkable.
 * - Returns [{x:startX, y:startY}] if start equals end.
 */
export function findPath(
  grid: Grid,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): Waypoint[] {
  // Trivial case: start === end
  if (startX === endX && startY === endY) {
    return [{ x: startX, y: startY }];
  }

  // Destination is blocked / out of bounds
  if (!grid.isWalkable(endX, endY)) {
    return [];
  }

  const openSet = new BinaryHeap<PathNode>();
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: manhattan(startX, startY, endX, endY),
    f: 0,
    score: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  startNode.score = startNode.f;

  openSet.push(startNode);

  while (openSet.size() > 0) {
    const current = openSet.pop()!;
    const currentKey = `${current.x},${current.y}`;

    // Reached the goal
    if (current.x === endX && current.y === endY) {
      return reconstructPath(current);
    }

    // Skip if already closed
    if (closedSet.has(currentKey)) continue;
    closedSet.add(currentKey);

    // Explore neighbours in 4 cardinal directions
    for (const [dx, dy] of DIRS) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      const neighbourKey = `${nx},${ny}`;
      if (closedSet.has(neighbourKey)) continue;
      if (!grid.isWalkable(nx, ny)) continue;

      const g = current.g + 1;
      const h = manhattan(nx, ny, endX, endY);
      const f = g + h;
      const neighbour: PathNode = {
        x: nx,
        y: ny,
        g,
        h,
        f,
        score: f,
        parent: current,
      };

      openSet.push(neighbour);
    }
  }

  // No path found
  return [];
}
