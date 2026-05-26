import { store } from '../core/store.js';
import { w2s } from '../core/viewport.js';
import {
  renderScene,
  drawSelectionBox,
  drawMultiSelectionBox,
} from './renderScene.js';
import { getMultiSelectionBBox } from '../input/hitTest.js';

function drawRubberBand() {
  const { ctx, isRubberBand, rubberBand } = store;
  if (!isRubberBand || !rubberBand) return;
  const { x1, y1, x2, y2 } = rubberBand;
  const rx = Math.min(x1, x2);
  const ry = Math.min(y1, y2);
  const rw = Math.abs(x2 - x1);
  const rh = Math.abs(y2 - y1);

  const isEraser = store.currentTool === 'eraser';
  ctx.save();
  ctx.strokeStyle = isEraser ? '#c92a2a' : '#1a73e8';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.fillStyle = isEraser ? 'rgba(201,42,42,0.08)' : 'rgba(26,115,232,0.06)';
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeRect(rx, ry, rw, rh);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawArrowSnapHighlight() {
  const { ctx, arrowSnapPoint } = store;
  if (!arrowSnapPoint) return;
  const { sx, sy } = w2s(arrowSnapPoint.wx, arrowSnapPoint.wy);
  ctx.save();
  ctx.strokeStyle = '#2f9e44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx, sy, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSnapLines() {
  const { ctx, snapLines, canvas } = store;
  if (!snapLines.length) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(26,115,232,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  for (const sl of snapLines) {
    if (sl.axis === 'x') {
      const { sx } = w2s(sl.value, 0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, canvas.height);
      ctx.stroke();
    } else {
      const { sy } = w2s(0, sl.value);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(canvas.width, sy);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.restore();
}

export function render() {
  if (!store.dirty) return;
  store.dirty = false;

  renderScene({
    ctx: store.ctx,
    rc: store.rc,
    canvasWidth: store.canvas.clientWidth,
    canvasHeight: store.canvas.clientHeight,
    shapes: store.shapes,
    viewport: store.vp,
    currentShape: store.currentShape,
    backgroundColor: store.backgroundColor,
    cullOffscreen: store.shapes.length > 80,
  });

  if (store.selectedIds.size === 1) {
    const s = store.shapes.find((sh) => sh.id === [...store.selectedIds][0]);
    if (s) drawSelectionBox(store.ctx, s, store.selectedIds.size, store.vp);
  } else if (store.selectedIds.size > 1) {
    const bb = getMultiSelectionBBox();
    if (bb) drawMultiSelectionBox(store.ctx, bb, store.vp, true);
  }

  drawRubberBand();
  drawArrowSnapHighlight();
  drawSnapLines();

  const zEl = document.getElementById('zoom-indicator');
  if (zEl) zEl.textContent = `${Math.round(store.vp.zoom * 100)}%`;

  const sig = [...store.selectedIds].sort().join(',');
  if (sig !== store._lastSelectionSig) {
    store._lastSelectionSig = sig;
    if (store.selectedIds.size > 0 && typeof store.onSelectionChange === 'function') {
      store.onSelectionChange();
    }
  }
}

export function rafLoop() {
  render();
  requestAnimationFrame(rafLoop);
}
