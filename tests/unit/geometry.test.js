import { describe, it, expect } from 'vitest';
import { shapeBBox, sceneBounds } from '../../src/core/geometry.js';
import { normalizeRect, simplifyPoints } from '../../src/core/math.js';

describe('shapeBBox', () => {
  it('returns rect dimensions', () => {
    expect(shapeBBox({ type: 'rect', x: 10, y: 20, w: 100, h: 50 })).toEqual({
      x: 10,
      y: 20,
      w: 100,
      h: 50,
    });
  });

  it('returns line bounding box', () => {
    const bb = shapeBBox({ type: 'line', x1: 0, y1: 0, x2: 30, y2: 40 });
    expect(bb).toEqual({ x: 0, y: 0, w: 30, h: 40 });
  });

  it('uses the chosen text box dimensions for text bounds', () => {
    const bb = shapeBBox({
      type: 'text',
      x: 5,
      y: 10,
      w: 90,
      h: 30,
      text: 'one\ntwo\nthree',
      fontSize: 24,
    });
    expect(bb).toEqual({ x: 5, y: 10, w: 90, h: 30 });
  });
});

describe('normalizeRect', () => {
  it('normalizes negative width and height', () => {
    expect(normalizeRect(0, 0, -50, -30)).toEqual({ x: -50, y: -30, w: 50, h: 30 });
  });
});

describe('simplifyPoints', () => {
  it('removes points closer than minDist', () => {
    const pts = [
      [0, 0],
      [1, 1],
      [10, 10],
    ];
    expect(simplifyPoints(pts, 5)).toEqual([
      [0, 0],
      [10, 10],
    ]);
  });
});

describe('sceneBounds', () => {
  it('includes padding', () => {
    const bounds = sceneBounds([{ type: 'rect', x: 0, y: 0, w: 100, h: 100 }], 10);
    expect(bounds.minX).toBe(-17);
    expect(bounds.minY).toBe(-17);
    expect(bounds.width).toBe(134);
    expect(bounds.height).toBe(134);
  });
});
