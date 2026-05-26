import { store, markDirty } from '../core/store.js';
import { dist, normalizeRect, simplifyPoints } from '../core/math.js';
import { makeShape } from '../core/scene.js';
import { saveHistory } from '../core/history.js';
import { findArrowSnap } from '../core/snap.js';
import { scheduleAutosave } from '../scene/persistence.js';
import { startTextEdit } from '../ui/textEditor.js';
import { hitShape } from './hitTest.js';
import { snapTo45, constrainToSquare } from './drawHelpers.js';
import { returnToSelectAfterShape } from './setTool.js';
import { isTextShapeCommitted, markTextShapeCommitted } from './textPlacement.js';
import { startRubberBand } from './rubberBand.js';

export { resetTextToolPlacement } from './textPlacement.js';

const ONE_SHOT_SHAPE_TYPES = new Set(['rect', 'ellipse', 'diamond']);

export function eraseAt(sx, sy) {
  const hit = hitShape(sx, sy);
  if (!hit) return;
  store.shapes = store.shapes.filter((s) => s.id !== hit.id);
  store.selectedIds.delete(hit.id);
  markDirty();
}

export function handleDrawMouseDown(e, sx, sy, wx, wy) {
  if (store.currentTool === 'text') return;

  if (store.currentTool === 'eraser') {
    startRubberBand(sx, sy);
    markDirty();
    return;
  }

  store.isDrawing = true;
  store.drawStart = { wx, wy };

  if (store.currentTool === 'pencil') {
    store.pencilPoints = [[wx, wy]];
    store.currentShape = makeShape('pencil', {
      points: [[wx, wy]],
      fillColor: null,
      roughness: 0,
    });
  } else if (store.currentTool === 'arrow' || store.currentTool === 'line') {
    const snap = findArrowSnap(sx, sy);
    const startWx = snap ? snap.wx : wx;
    const startWy = snap ? snap.wy : wy;
    store.arrowSnapPoint = snap || null;

    store.currentShape = makeShape(store.currentTool, {
      x1: startWx,
      y1: startWy,
      x2: startWx,
      y2: startWy,
      fillColor: null,
      fromShapeId: snap ? snap.shapeId : null,
      fromSide: snap ? snap.side : null,
      toShapeId: null,
      toSide: null,
    });
    store.drawStart = { wx: startWx, wy: startWy };
  } else {
    store.currentShape = makeShape(store.currentTool, {
      x: wx,
      y: wy,
      w: 0,
      h: 0,
    });
  }

  markDirty();
}

export function handleDrawMove(sx, sy, wx, wy, shiftKey) {
  const s = store.currentShape;

  if (s.type === 'pencil') {
    store.pencilPoints.push([wx, wy]);
    s.points = [...store.pencilPoints];
    markDirty();
    return;
  }

  if (s.type === 'arrow' || s.type === 'line') {
    const snap = findArrowSnap(sx, sy, [s.id]);
    store.arrowSnapPoint = snap || null;

    let endWx = snap ? snap.wx : wx;
    let endWy = snap ? snap.wy : wy;

    if (!snap && shiftKey) {
      const snapped = snapTo45(endWx, endWy, store.drawStart.wx, store.drawStart.wy);
      endWx = snapped.wx;
      endWy = snapped.wy;
    }

    s.x2 = endWx;
    s.y2 = endWy;
    s.toShapeId = snap ? snap.shapeId : null;
    s.toSide = snap ? snap.side : null;
    markDirty();
    return;
  }

  let endWx = wx;
  let endWy = wy;
  if (shiftKey) {
    const sq = constrainToSquare(endWx, endWy, store.drawStart.wx, store.drawStart.wy);
    endWx = sq.wx;
    endWy = sq.wy;
  }

  const norm = normalizeRect(
    store.drawStart.wx,
    store.drawStart.wy,
    endWx - store.drawStart.wx,
    endWy - store.drawStart.wy,
  );
  s.x = norm.x;
  s.y = norm.y;
  s.w = norm.w;
  s.h = norm.h;
  markDirty();
}

export function finishDrawing() {
  store.isDrawing = false;

  if (!store.currentShape) return;

  const s = store.currentShape;
  store.currentShape = null;
  store.arrowSnapPoint = null;

  if (s.type === 'rect' || s.type === 'ellipse' || s.type === 'diamond') {
    if (s.w < 4 && s.h < 4) {
      s.w = 120;
      s.h = 80;
    }
  }

  if (s.type === 'pencil') {
    s.roughness = 0;
    s.points = simplifyPoints(store.pencilPoints);
    store.pencilPoints = [];
    if (s.points.length < 2) return;
  }

  if (s.type === 'arrow' || s.type === 'line') {
    const len = dist(s.x1, s.y1, s.x2, s.y2);
    if (len < 4) return;
  }

  s.seed = Math.floor(Math.random() * 10000) + 1;

  store.shapes.push(s);
  saveHistory();
  scheduleAutosave();

  if (
    ONE_SHOT_SHAPE_TYPES.has(s.type) ||
    s.type === 'arrow' ||
    s.type === 'line'
  ) {
    store.selectedIds = new Set([s.id]);
    returnToSelectAfterShape();
  } else {
    store.selectedIds.clear();
  }

  markDirty();
}

export function placeTextShape(wx, wy) {
  if (isTextShapeCommitted()) return;
  markTextShapeCommitted();

  const shape = makeShape('text', {
    x: wx,
    y: wy,
    w: 200,
    h: 40,
    text: '',
    fillColor: null,
  });

  store.shapes.push(shape);
  saveHistory();
  scheduleAutosave();
  returnToSelectAfterShape();
  store.selectedIds = new Set([shape.id]);
  markDirty();
  startTextEdit(shape.id);
}
