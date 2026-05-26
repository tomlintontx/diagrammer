import { store, markDirty } from '../core/store.js';
import { sl2wl } from '../core/viewport.js';
import { saveHistory } from '../core/history.js';
import { updateConnectedArrows } from './snap.js';
import { cloneShapeWithOffset } from '../core/shapeClone.js';

export function applyStyleToSelection(prop, value, recordHistory = true) {
  store.styleDefaults[prop] = value;
  if (store.selectedIds.size > 0) {
    for (const s of store.shapes) {
      if (store.selectedIds.has(s.id)) {
        s[prop] = value;
      }
    }
    if (recordHistory) saveHistory();
    markDirty();
  }
}

export function cloneSelectedWithOffset(selectedIds = store.selectedIds, offset = sl2wl(16)) {
  const newIds = new Set();
  for (const id of selectedIds) {
    const shape = store.shapes.find((item) => item.id === id);
    if (!shape) continue;
    const clone = cloneShapeWithOffset(shape, offset);
    store.shapes.push(clone);
    newIds.add(clone.id);
  }
  return newIds;
}

export function duplicateSelected() {
  if (!store.selectedIds.size) return;
  store.selectedIds = cloneSelectedWithOffset();
  saveHistory();
  markDirty();
}

export function pasteClipboard() {
  if (!store.clipboard?.length) return;
  const offset = sl2wl(16);
  const newIds = new Set();
  for (const shape of store.clipboard) {
    const clone = cloneShapeWithOffset(shape, offset);
    store.shapes.push(clone);
    newIds.add(clone.id);
  }
  store.selectedIds = newIds;
  saveHistory();
  markDirty();
}

export function deleteSelected() {
  if (!store.selectedIds.size) return;
  store.shapes = store.shapes.filter((s) => !store.selectedIds.has(s.id));
  store.selectedIds.clear();
  saveHistory();
  markDirty();
}

export function copySelected() {
  if (!store.selectedIds.size) return;
  const selected = store.shapes.filter((s) => store.selectedIds.has(s.id));
  store.clipboard = JSON.parse(JSON.stringify(selected));
}

export function cutSelected() {
  copySelected();
  deleteSelected();
}

export function nudgeSelection(dx, dy) {
  if (!store.selectedIds.size) return;
  for (const id of store.selectedIds) {
    const s = store.shapes.find((sh) => sh.id === id);
    if (!s) continue;
    if (s.type === 'arrow' || s.type === 'line') {
      s.x1 += dx;
      s.y1 += dy;
      s.x2 += dx;
      s.y2 += dy;
    } else if (s.type === 'pencil') {
      s.points = s.points.map(([px, py]) => [px + dx, py + dy]);
    } else {
      s.x += dx;
      s.y += dy;
    }
    updateConnectedArrows(id);
  }
  saveHistory();
  markDirty();
}
