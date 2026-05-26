import { describe, it, expect } from 'vitest';
import { snapTo45, constrainToSquare } from '../../src/input/drawHelpers.js';

describe('drawHelpers', () => {
  it('snaps to 45 degree angles', () => {
    const result = snapTo45(10, 10, 0, 0);
    expect(Math.abs(result.wx - result.wy)).toBeLessThan(0.01);
  });

  it('constrains to a square', () => {
    const result = constrainToSquare(30, 10, 0, 0);
    expect(result.wx).toBe(30);
    expect(result.wy).toBe(30);
  });
});
