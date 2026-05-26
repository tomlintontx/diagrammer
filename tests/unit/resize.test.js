import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/core/store.js';
import { applyBoxResize, getLineEndpointHandle } from '../../src/core/resize.js';

describe('resize', () => {
  it('resizes from southeast handle', () => {
    const orig = { x: 0, y: 0, w: 100, h: 80 };
    const resized = applyBoxResize(orig, 'se', 120, 90, false);
    expect(resized.w).toBe(120);
    expect(resized.h).toBe(90);
  });

  it('preserves square proportions with shift key on se handle', () => {
    const orig = { x: 0, y: 0, w: 100, h: 80 };
    const resized = applyBoxResize(orig, 'se', 120, 90, true);
    expect(resized.w).toBe(resized.h);
  });

  describe('line endpoint handles', () => {
    beforeEach(() => {
      store.vp = { x: 0, y: 0, zoom: 1 };
    });

    it('detects start and end handles', () => {
      const arrow = { type: 'arrow', x1: 10, y1: 20, x2: 110, y2: 20 };
      expect(getLineEndpointHandle(arrow, 10, 20)).toBe('start');
      expect(getLineEndpointHandle(arrow, 110, 20)).toBe('end');
      expect(getLineEndpointHandle(arrow, 60, 20)).toBe(null);
    });
  });
});
