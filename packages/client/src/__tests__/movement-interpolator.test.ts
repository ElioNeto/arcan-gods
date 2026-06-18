import { describe, it, expect, beforeEach } from 'vitest';
import { MovementInterpolator } from '../systems/MovementInterpolator.js';
import type { Waypoint } from '@arcan-gods/shared';

describe('MovementInterpolator', () => {
  let interpolator: MovementInterpolator;

  beforeEach(() => {
    interpolator = new MovementInterpolator();
  });

  it('startPath and getPosition return the initial position', () => {
    const path: Waypoint[] = [
      { x: 100, y: 200 },
      { x: 300, y: 400 },
    ];
    interpolator.startPath('entity-1', path);

    const pos = interpolator.getPosition('entity-1');
    expect(pos).toEqual({ x: 100, y: 200 });
  });

  it('update advances position along the path', () => {
    const path: Waypoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    // speed = 10 tiles/s, delta = 0.05s => 0.5 tiles moved
    interpolator.startPath('entity-1', path, 10);
    interpolator.update(0.05);

    const pos = interpolator.getPosition('entity-1');
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeCloseTo(5, 1);
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

    // speed = 10 tiles/s, path has 1 segment of 10 tiles
    // With the algorithm, each segment is treated as distance 1,
    // so 10 tiles/s means the segment is consumed in 0.1s
    interpolator.startPath('entity-1', path, 10);

    // Move most of the way (0.09s enough to almost finish 1 segment at 10 tiles/s)
    for (let i = 0; i < 3; i++) {
      interpolator.update(0.025);
    }
    // 3 * 0.025 = 0.075s, progress = 10 * 0.075 = 0.75
    let pos = interpolator.getPosition('entity-1');
    expect(pos).not.toBeNull();
    expect(pos!.x).toBeCloseTo(7.5, 0);

    // Finish remaining
    interpolator.update(0.03); // brings to 0.105s total, progress = 1.05 >= 1 => arrived
    pos = interpolator.getPosition('entity-1');
    expect(pos).toBeNull(); // no longer active
    expect(interpolator.hasEntity('entity-1')).toBe(true); // still tracked
  });

  it('handles diagonal movement correctly', () => {
    const path: Waypoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    interpolator.startPath('entity-1', path, 10);
    interpolator.update(0.05); // 0.5 tiles progress (halfway)

    const pos = interpolator.getPosition('entity-1');
    expect(pos).toEqual({ x: 5, y: 5 });
  });

  it('multiple entities interpolate independently', () => {
    interpolator.startPath('entity-1', [{ x: 0, y: 0 }, { x: 10, y: 0 }], 10);
    interpolator.startPath('entity-2', [{ x: 100, y: 100 }, { x: 200, y: 200 }], 10);

    interpolator.update(0.05); // 0.5 tiles

    const pos1 = interpolator.getPosition('entity-1');
    const pos2 = interpolator.getPosition('entity-2');

    expect(pos1).toEqual({ x: 5, y: 0 });
    expect(pos2).toEqual({ x: 150, y: 150 });
  });
});
