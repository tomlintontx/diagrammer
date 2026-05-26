import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/core/store.js';
import { bboxesIntersect } from '../../src/input/drawHelpers.js';
import { handleSelectMouseDown } from '../../src/input/selectTool.js';

describe('rubber-band intersection', () => {
  it('selects when shapes overlap band partially', () => {
    expect(bboxesIntersect(0, 0, 100, 100, 50, 50, 200, 200)).toBe(true);
  });

  it('does not select when fully outside', () => {
    expect(bboxesIntersect(0, 0, 50, 50, 60, 60, 100, 100)).toBe(false);
  });
});

describe('selection modifiers', () => {
  beforeEach(() => {
    store.shapes = [
      { id: 'r1', type: 'rect', x: 0, y: 0, w: 20, h: 20 },
      { id: 'r2', type: 'rect', x: 40, y: 0, w: 20, h: 20 },
    ];
    store.selectedIds = new Set();
    store.vp = { x: 0, y: 0, zoom: 1 };
    store.isDragging = false;
    store.dragMode = null;
  });

  it('toggles shapes into a multi-selection with the command key', () => {
    handleSelectMouseDown({ metaKey: true, shiftKey: false, ctrlKey: false }, 10, 10);
    handleSelectMouseDown({ metaKey: true, shiftKey: false, ctrlKey: false }, 50, 10);

    expect([...store.selectedIds].sort()).toEqual(['r1', 'r2']);
    expect(store.isDragging).toBe(false);
  });

  it('removes a selected shape with the command key', () => {
    store.selectedIds = new Set(['r1', 'r2']);

    handleSelectMouseDown({ metaKey: true, shiftKey: false, ctrlKey: false }, 10, 10);

    expect([...store.selectedIds]).toEqual(['r2']);
    expect(store.isDragging).toBe(false);
  });
});
