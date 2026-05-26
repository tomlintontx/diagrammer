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

  it('applies formatting to every selected shape', () => {
    store.shapes.push({ id: 'r2', type: 'rect', x: 30, y: 0, w: 20, h: 20 });
    store.selectedIds = new Set(['r1', 'r2']);

    applyStyleToSelection('strokeColor', '#e03131', false);

    expect(store.shapes.map((shape) => shape.strokeColor)).toEqual(['#e03131', '#e03131']);
    expect(store.styleDefaults.strokeColor).toBe('#e03131');
  });
});
