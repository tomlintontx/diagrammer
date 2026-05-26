import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/core/store.js';
import { computeMoveSnap } from '../../src/core/snap.js';

describe('snap', () => {
  beforeEach(() => {
    store.shapes = [
      { id: 'a', type: 'rect', x: 0, y: 0, w: 100, h: 50 },
      { id: 'b', type: 'rect', x: 200, y: 0, w: 100, h: 50 },
    ];
    store.vp = { x: 0, y: 0, zoom: 1 };
  });

  it('snaps moving shape edge to static shape edge', () => {
    const movingIds = new Set(['b']);
    const result = computeMoveSnap(movingIds, { b: { dx: -95, dy: 0 } });
    expect(Math.abs(result.dx)).toBeLessThanOrEqual(8);
  });
});
