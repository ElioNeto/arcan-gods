import { describe, it, expect, beforeEach } from 'vitest';
import { MovementInterpolator } from '../systems/MovementInterpolator.js';
import { GAME_CONSTANTS } from '@arcan-gods/shared';
import type { Waypoint } from '@arcan-gods/shared';

const TILE_SIZE = GAME_CONSTANTS.TILE_SIZE;

describe('MovementInterpolator', () => {
  let interpolator: MovementInterpolator;

  beforeEach(() => {
    interpolator = new MovementInterpolator();
  });

  it('startPath and getPosition return the initial position in pixels', () => {
    const path: Waypoint[] = [
      { x: 100, y: 200 },
      { x: 300, y: 400 },
    ];
    interpolator.startPath('entity-1', path);

    const pos = interpolator.getPosition('entity-1');
    // Tile coords (100,200) → pixel coords (3200, 6400)
    expect(pos).toEqual({ x: 100 * TILE_SIZE, y: 200 * TILE_SIZE });
  });

  it('update advances position along the path in pixels', () => {
    const path: Waypoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    // speed = 10 tiles/s, delta = 0.05s => 0.5 tiles moved
    interpolator.startPath('entity-1', path, 10);
    interpolator.update(0.05);

    const pos = interpolator.getPosition('entity-1');
    expect(pos).not.toBeNull();
    // 0.5 tiles progress → pixel position: 0.5 * 10 * TILE_SIZE / 10? No...
    // Each waypoint segment = 1 tile (algorithm treats segments as unit distance)
    // speed = 10 tiles/s, 0.05s → 0.5 tiles along segment 0→1
    // progress = 0.5, x = 0 + (10-0) * 0.5 * TILE_SIZE = 5 * TILE_SIZE = 160
    expect(pos!.x).toBeCloseTo(5 * TILE_SIZE, 1);
    expect(pos!.y).toBeCloseTo(0, 1);
  });

  it('startPath with fewer than 2 waypoints does nothing', () => {
    interpolator.startPath('entity-1', [{ x: 10, y: 20 }]);
    expect(interpolator.hasEntity('entity-1')).toBe(false);
    expect(interpolator.getPosition('entity-1')).toBeNull();
  });

  it('startPath with empty array does nothing', () => {
    interpolator.startPath('entity-1', []);
    expect(interpolator.hasEntity('entity-1')).toBe(false);
    expect(interpolator.getPosition('entity-1')).toBeNull();
  });

  it('remove entity from interpolation', () => {
    const path: Waypoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    interpolator.startPath('entity-1', path);
    expect(interpolator.hasEntity('entity-1')).toBe(true);

    interpolator.remove('entity-1');
    expect(interpolator.hasEntity('entity-1')).toBe(false);
    expect(interpolator.getPosition('entity-1')).toBeNull();
  });

  it('clear removes all entities', () => {
    const path: Waypoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    interpolator.startPath('entity-1', path);
    interpolator.startPath('entity-2', path);
    expect(interpolator.hasEntity('entity-1')).toBe(true);
    expect(interpolator.hasEntity('entity-2')).toBe(true);

    interpolator.clear();
    expect(interpolator.hasEntity('entity-1')).toBe(false);
    expect(interpolator.hasEntity('entity-2')).toBe(false);
  });

  it('getPosition returns null for non-existent entity', () => {
    expect(interpolator.getPosition('non-existent')).toBeNull();
  });

  it('completes interpolation and reaches the final waypoint', () => {
    const path: Waypoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];

    // speed = 10 tiles/s, path has 1 segment
    // Each segment is distance 1 in the algorithm
    interpolator.startPath('entity-1', path, 10);

    // Move most of the way (0.09s enough to almost finish 1 segment at 10 tiles/s)
    for (let i = 0; i < 3; i++) {
      interpolator.update(0.025);
    }
    // 3 * 0.025 = 0.075s, progress = 10 * 0.075 = 0.75
    let pos = interpolator.getPosition('entity-1');
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeCloseTo(7.5 * TILE_SIZE, 0);

    // Finish remaining
    interpolator.update(0.03); // brings to 0.105s total, progress = 1.05 >= 1 => arrived
    pos = interpolator.getPosition('entity-1');
    expect(pos).toBeNull(); // no longer active
    expect(interpolator.hasEntity('entity-1')).toBe(true); // still tracked
  });

  it('handles diagonal movement correctly in pixels', () => {
    const path: Waypoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    interpolator.startPath('entity-1', path, 10);
    interpolator.update(0.05); // 0.5 tiles progress (halfway)

    const pos = interpolator.getPosition('entity-1');
    // 0.5 progress on diagonal: pixel pos = (0 + 10*0.5, 0 + 10*0.5) * TILE_SIZE
    expect(pos).toEqual({ x: 5 * TILE_SIZE, y: 5 * TILE_SIZE });
  });

  it('multiple entities interpolate independently in pixels', () => {
    interpolator.startPath('entity-1', [{ x: 0, y: 0 }, { x: 10, y: 0 }], 10);
    interpolator.startPath('entity-2', [{ x: 100, y: 100 }, { x: 200, y: 200 }], 10);

    interpolator.update(0.05); // 0.5 tiles

    const pos1 = interpolator.getPosition('entity-1');
    const pos2 = interpolator.getPosition('entity-2');

    expect(pos1).toEqual({ x: 5 * TILE_SIZE, y: 0 });
    expect(pos2).toEqual({ x: 150 * TILE_SIZE, y: 150 * TILE_SIZE });
  });
});
