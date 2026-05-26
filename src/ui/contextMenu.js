import { store, markDirty } from '../core/store.js';
import { saveHistory } from '../core/history.js';
import { scheduleAutosave } from '../scene/persistence.js';

export function initContextMenu() {
  document.getElementById('ctx-front').addEventListener('click', () => {
    if (!store.ctxMenuShapeId) return;
    const idx = store.shapes.findIndex((s) => s.id === store.ctxMenuShapeId);
    if (idx < 0) return;
    const [s] = store.shapes.splice(idx, 1);
    store.shapes.push(s);
    saveHistory();
    scheduleAutosave();
    markDirty();
    hideContextMenu();
  });

  document.getElementById('ctx-back').addEventListener('click', () => {
    if (!store.ctxMenuShapeId) return;
    const idx = store.shapes.findIndex((s) => s.id === store.ctxMenuShapeId);
    if (idx < 0) return;
    const [s] = store.shapes.splice(idx, 1);
    store.shapes.unshift(s);
    saveHistory();
    scheduleAutosave();
    markDirty();
    hideContextMenu();
  });

  document.getElementById('ctx-delete').addEventListener('click', () => {
    if (!store.ctxMenuShapeId) return;
    store.shapes = store.shapes.filter((s) => s.id !== store.ctxMenuShapeId);
    store.selectedIds.delete(store.ctxMenuShapeId);
    saveHistory();
    scheduleAutosave();
    markDirty();
    hideContextMenu();
  });

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('context-menu');
    if (menu.style.display === 'block' && !menu.contains(e.target)) {
      hideContextMenu();
    }
  });
}

export function showContextMenu(x, y) {
  const menu = document.getElementById('context-menu');
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.display = 'block';
}

export function hideContextMenu() {
  const menu = document.getElementById('context-menu');
  menu.style.display = 'none';
  store.ctxMenuShapeId = null;
}
