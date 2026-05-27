import { store, markDirty } from '../core/store.js';
import { s2w, sl2wl } from '../core/viewport.js';
import { saveHistory } from '../core/history.js';
import { updateConnectedArrows } from './snap.js';
import { cloneShapeWithOffset } from '../core/shapeClone.js';
import { shapeBBox } from './geometry.js';

export function applyStyleToSelection(prop, value, recordHistory = true) {
  store.styleDefaults[prop] = value;
  if (store.selectedIds.size > 0) {
    for (const s of store.shapes) {
      if (store.selectedIds.has(s.id)) {
        if (prop === 'arrowDirection' && s.type !== 'arrow' && s.type !== 'line') continue;
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

function clipboardCentroid(shapes) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of shapes) {
    const bb = shapeBBox(s);
    if (bb.x < minX) minX = bb.x;
    if (bb.y < minY) minY = bb.y;
    if (bb.x + bb.w > maxX) maxX = bb.x + bb.w;
    if (bb.y + bb.h > maxY) maxY = bb.y + bb.h;
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

export function getPasteTargetWorld() {
  if (store.lastPointer) {
    return s2w(store.lastPointer.sx, store.lastPointer.sy);
  }
  if (store.canvas) {
    return s2w(store.canvas.clientWidth / 2, store.canvas.clientHeight / 2);
  }
  return null;
}

export function pasteClipboard() {
  if (!store.clipboard?.length) return;

  const target = getPasteTargetWorld();
  let dx;
  let dy;
  if (target) {
    const { cx, cy } = clipboardCentroid(store.clipboard);
    dx = target.wx - cx;
    dy = target.wy - cy;
  } else {
    dx = dy = sl2wl(16);
  }

  const newIds = new Set();
  for (const shape of store.clipboard) {
    const clone = cloneShapeWithOffset(shape, dx, dy);
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
