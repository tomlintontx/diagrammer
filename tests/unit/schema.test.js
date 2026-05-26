import { describe, it, expect } from 'vitest';
import { normalizeShape, validateAndNormalizeShapes } from '../../src/core/schema.js';

const defaults = {
  strokeColor: '#1e1e1e',
  fillColor: '#fff',
  strokeWidth: 1,
  roughness: 1,
  fontSize: 24,
  fontFamily: 'Caveat',
  textAlign: 'left',
  textVerticalAlign: 'middle',
  opacity: 1,
  strokeStyle: 'solid',
  fillStyle: 'solid',
};

describe('shape schema', () => {
  it('normalizes rect with style defaults', () => {
    const s = normalizeShape({ type: 'rect', x: 1, y: 2, w: 3, h: 4 }, defaults);
    expect(s.type).toBe('rect');
    expect(s.opacity).toBe(1);
    expect(s.strokeStyle).toBe('solid');
    expect(s.textVerticalAlign).toBe('middle');
  });

  it('drops invalid shapes', () => {
    const out = validateAndNormalizeShapes([{ type: 'bogus' }, { type: 'rect', x: 0, y: 0, w: 10, h: 10 }], defaults);
    expect(out).toHaveLength(1);
  });
});
