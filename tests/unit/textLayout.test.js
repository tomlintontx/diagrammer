import { describe, it, expect } from 'vitest';
import { fitTextToBox, wrapText } from '../../src/core/textLayout.js';

function fakeCtx() {
  return {
    font: '',
    measureText(text) {
      const size = Number.parseFloat(this.font) || 18;
      return { width: String(text).length * size * 0.55 };
    },
  };
}

describe('textLayout', () => {
  it('wraps long text to fit the requested width', () => {
    const ctx = fakeCtx();
    const font = "18px 'Caveat', cursive";
    const lines = wrapText(ctx, 'one two three four five', 60, font);
    expect(lines.length).toBeGreaterThan(1);
  });

  it('shrinks inline text when it would exceed box height', () => {
    const ctx = fakeCtx();
    const shape = { fontSize: 24, fontFamily: 'Caveat' };
    const fit = fitTextToBox(ctx, shape, 'one two three four five six seven eight', 80, 35);
    expect(fit.fontSize).toBeLessThan(24);
    expect(fit.totalHeight).toBeLessThanOrEqual(35);
  });
});
