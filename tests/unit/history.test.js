import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../../src/core/store.js';
import { saveHistory, undo, redo } from '../../src/core/history.js';

describe('history', () => {
  beforeEach(() => {
    store.shapes = [{ id: 'r1', type: 'rect', x: 0, y: 0, w: 10, h: 10 }];
    store.selectedIds = new Set(['r1']);
    store.history = [];
    store.historyIndex = -1;
  });

  it('records and undoes shape changes', () => {
    saveHistory();
    store.shapes.push({ id: 'r2', type: 'rect', x: 5, y: 5, w: 10, h: 10 });
    saveHistory();
    expect(store.shapes).toHaveLength(2);
    undo();
    expect(store.shapes).toHaveLength(1);
    redo();
    expect(store.shapes).toHaveLength(2);
  });
});
