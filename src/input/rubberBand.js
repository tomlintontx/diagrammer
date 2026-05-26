import { store, markDirty } from '../core/store.js';
import { shapeBBox } from '../core/geometry.js';
import { w2s } from '../core/viewport.js';
import { bboxesIntersect } from './drawHelpers.js';

export function startRubberBand(sx, sy) {
  store.isRubberBand = true;
  store.rubberBand = { x1: sx, y1: sy, x2: sx, y2: sy };
}

function rubberBandHasArea(band = store.rubberBand) {
  if (!band) return false;
  return Math.abs(band.x2 - band.x1) > 4 || Math.abs(band.y2 - band.y1) > 4;
}

export function getShapeIdsInRubberBand(shapes = store.shapes) {
  if (!store.rubberBand || !rubberBandHasArea()) return [];

  const { x1, y1, x2, y2 } = store.rubberBand;
  const rx1 = Math.min(x1, x2);
  const ry1 = Math.min(y1, y2);
  const rx2 = Math.max(x1, x2);
  const ry2 = Math.max(y1, y2);
  const ids = [];

  for (const s of shapes) {
    const bb = shapeBBox(s);
    const { sx: bx1, sy: by1 } = w2s(bb.x, bb.y);
    const { sx: bx2, sy: by2 } = w2s(bb.x + bb.w, bb.y + bb.h);
    if (bboxesIntersect(bx1, by1, bx2, by2, rx1, ry1, rx2, ry2)) {
      ids.push(s.id);
    }
  }

  return ids;
}

export function finishRubberBand() {
  store.isRubberBand = false;
  if (!store.rubberBand) return;

  for (const id of getShapeIdsInRubberBand()) {
    store.selectedIds.add(id);
  }

  store.rubberBand = null;
  markDirty();
}

export function finishEraserBand(eraseAt) {
  store.isRubberBand = false;
  if (!store.rubberBand) return false;

  const isMarquee = rubberBandHasArea();
  if (isMarquee) {
    const ids = new Set(getShapeIdsInRubberBand());
    if (ids.size) {
      store.shapes = store.shapes.filter((s) => !ids.has(s.id));
      for (const id of ids) store.selectedIds.delete(id);
    }
  } else if (typeof eraseAt === 'function') {
    eraseAt(store.rubberBand.x1, store.rubberBand.y1);
  }

  store.rubberBand = null;
  markDirty();
  return isMarquee;
}
