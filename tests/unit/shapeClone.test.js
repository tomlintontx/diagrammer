import { describe, it, expect } from 'vitest';
import { cloneShapeWithOffset } from '../../src/core/shapeClone.js';

describe('cloneShapeWithOffset', () => {
  it('offsets rect shapes and assigns a new id', () => {
    const clone = cloneShapeWithOffset({ id: 'a', type: 'rect', x: 1, y: 2, w: 10, h: 10 }, 16);
    expect(clone.id).not.toBe('a');
    expect(clone.x).toBe(17);
    expect(clone.y).toBe(18);
  });

  it('clears arrow bindings when offsetting', () => {
    const clone = cloneShapeWithOffset(
      { id: 'a', type: 'arrow', x1: 0, y1: 0, x2: 10, y2: 10, fromShapeId: 'x', toShapeId: 'y' },
      5,
    );
    expect(clone.fromShapeId).toBeNull();
    expect(clone.toShapeId).toBeNull();
    expect(clone.x1).toBe(5);
  });
});
