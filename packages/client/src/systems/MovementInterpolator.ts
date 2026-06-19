import type { Waypoint } from '@arcan-gods/shared';
import { GAME_CONSTANTS } from '@arcan-gods/shared';

const TILE_SIZE = GAME_CONSTANTS.TILE_SIZE;

interface InterpolationState {
  path: Waypoint[];        // path in TILE coordinates
  pixelPath: Array<{ x: number; y: number }>; // path in PIXEL coordinates (tile * TILE_SIZE)
  currentIndex: number;
  progress: number;         // 0 to 1 between current waypoint and next
  speed: number;            // tiles per second
  active: boolean;
}

export class MovementInterpolator {
  private entities: Map<string, InterpolationState> = new Map();

  /** Inicia interpolação para uma entidade com path em TILE coordinates */
  startPath(entityId: string, path: Waypoint[], speed: number = 4): void {
    if (path.length < 2) return;
    // Convert tile path to pixel positions
    const pixelPath = path.map(wp => ({
      x: wp.x * TILE_SIZE,
      y: wp.y * TILE_SIZE,
    }));
    this.entities.set(entityId, {
      path,
      pixelPath,
      currentIndex: 0,
      progress: 0,
      speed,
      active: true,
    });
  }

  /** Atualiza todas as interpolações (chamado a cada frame) */
  update(deltaSec: number): void {
    for (const [, state] of this.entities) {
      if (!state.active) continue;

      // Calculate distance to move this frame (in tiles)
      const tilesToMove = state.speed * deltaSec;

      // Convert to progress (0-1 between current waypoint and next)
      state.progress += tilesToMove;

      // Consume waypoints
      while (state.progress >= 1 && state.currentIndex < state.path.length - 2) {
        state.currentIndex++;
        state.progress -= 1;
      }

      // Check if arrived
      if (state.currentIndex >= state.path.length - 2 && state.progress >= 1) {
        state.active = false;
      }
    }
  }

  /** Obtém a posição interpolada atual em PIXEL coordinates */
  getPosition(entityId: string): { x: number; y: number } | null {
    const state = this.entities.get(entityId);
    if (!state || !state.active) return null;

    const current = state.pixelPath[state.currentIndex];
    const next = state.pixelPath[Math.min(state.currentIndex + 1, state.pixelPath.length - 1)];

    // Only interpolate if there's a next point
    if (!next || current === next) {
      return { x: current.x, y: current.y };
    }

    return {
      x: current.x + (next.x - current.x) * state.progress,
      y: current.y + (next.y - current.y) * state.progress,
    };
  }

  /** Remove interpolação */
  remove(entityId: string): void {
    this.entities.delete(entityId);
  }

  /** Limpa tudo */
  clear(): void {
    this.entities.clear();
  }

  /** Verifica se uma entidade está interpolando */
  hasEntity(entityId: string): boolean {
    return this.entities.has(entityId);
  }
}
