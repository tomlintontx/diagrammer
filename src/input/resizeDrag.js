import { store, markDirty } from '../core/store.js';
import { applyGroupResize, applyBoxResize, canResizeShape, isLineShape } from '../core/resize.js';
import { findArrowSnap, updateConnectedArrows } from '../core/snap.js';
import { snapTo45 } from './drawHelpers.js';

export function handleResizeDrag(sx, sy, wx, wy, shiftKey) {
  if (store.dragMode.startsWith('resize-group-')) {
    const handle = store.dragMode.slice('resize-group-'.length);
    const groupOrig = store.resizeGroupOrig;
    if (!groupOrig) return;
    applyGroupResize(groupOrig.group, groupOrig.shapes, handle, wx, wy);
    for (const snap of groupOrig.shapes) {
      if (snap.shape.id) updateConnectedArrows(snap.shape.id);
    }
    markDirty();
    return;
  }

  const s = store.resizeTarget;
  if (!s) return;
  const orig = store.dragStartShapePositions[s.id];
  if (!orig) return;

  const handle = store.dragMode.slice('resize-'.length);

  if (isLineShape(s)) {
    const anchor =
      handle === 'start' ? { wx: orig.x2, wy: orig.y2 } : { wx: orig.x1, wy: orig.y1 };
    const snap = findArrowSnap(sx, sy, [s.id]);
    store.arrowSnapPoint = snap || null;

    let targetWx = snap ? snap.wx : wx;
    let targetWy = snap ? snap.wy : wy;
    if (!snap && shiftKey) {
      const snapped = snapTo45(targetWx, targetWy, anchor.wx, anchor.wy);
      targetWx = snapped.wx;
      targetWy = snapped.wy;
    }

    if (handle === 'start') {
      s.x1 = targetWx;
      s.y1 = targetWy;
      s.fromShapeId = snap ? snap.shapeId : null;
      s.fromSide = snap ? snap.side : null;
    } else if (handle === 'end') {
      s.x2 = targetWx;
      s.y2 = targetWy;
      s.toShapeId = snap ? snap.shapeId : null;
      s.toSide = snap ? snap.side : null;
    }
    markDirty();
    return;
  }

  if (!canResizeShape(s)) return;

  const resized = applyBoxResize(orig, handle, wx, wy, shiftKey);
  s.x = resized.x;
  s.y = resized.y;
  if (resized.w != null) s.w = resized.w;
  if (resized.h != null) s.h = resized.h;
  updateConnectedArrows(s.id);
  markDirty();
}
