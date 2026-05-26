import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/core/store.js';
import { hitTest } from '../../src/input/hitTest.js';

describe('hitTest', () => {
  beforeEach(() => {
    store.vp = { x: 0, y: 0, zoom: 1 };
  });

  it('hits inside a rectangle', () => {
    const rect = { type: 'rect', x: 10, y: 10, w: 100, h: 50 };
    expect(hitTest(rect, 50, 30)).toBe(true);
    expect(hitTest(rect, 0, 0)).toBe(false);
  });

  it('hits near a line segment', () => {
    const line = { type: 'line', x1: 0, y1: 0, x2: 100, y2: 0 };
    expect(hitTest(line, 50, 2)).toBe(true);
    expect(hitTest(line, 50, 50)).toBe(false);
  });
});
