import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/core/store.js';
import {
  applyStyleToSelection,
  duplicateSelected,
  deleteSelected,
  copySelected,
  pasteClipboard,
} from '../../src/core/commands.js';

describe('commands', () => {
  beforeEach(() => {
    store.shapes = [{ id: 'r1', type: 'rect', x: 0, y: 0, w: 20, h: 20 }];
    store.selectedIds = new Set(['r1']);
    store.clipboard = null;
    store.canvas = null;
    store.lastPointer = null;
    store.vp.x = 0;
    store.vp.y = 0;
    store.vp.zoom = 1;
  });

  it('duplicates selected shapes', () => {
    duplicateSelected();
    expect(store.shapes).toHaveLength(2);
    expect(store.selectedIds.size).toBe(1);
    expect(store.shapes[1].id).not.toBe('r1');
  });

  it('deletes selected shapes', () => {
    deleteSelected();
    expect(store.shapes).toHaveLength(0);
    expect(store.selectedIds.size).toBe(0);
  });

  it('copies and pastes clipboard shapes', () => {
    copySelected();
    store.selectedIds.clear();
    pasteClipboard();
    expect(store.shapes).toHaveLength(2);
    expect(store.selectedIds.size).toBe(1);
  });

  it('pastes clipboard centered at the cursor when available', () => {
    copySelected();
    store.lastPointer = { sx: 200, sy: 150 };
    pasteClipboard();
    const pasted = store.shapes[1];
    expect(pasted.x + pasted.w / 2).toBe(200);
    expect(pasted.y + pasted.h / 2).toBe(150);
  });

  it('applies formatting to every selected shape', () => {
    store.shapes.push({ id: 'r2', type: 'rect', x: 30, y: 0, w: 20, h: 20 });
    store.selectedIds = new Set(['r1', 'r2']);

    applyStyleToSelection('strokeColor', '#e03131', false);

    expect(store.shapes.map((shape) => shape.strokeColor)).toEqual(['#e03131', '#e03131']);
    expect(store.styleDefaults.strokeColor).toBe('#e03131');
  });
});
