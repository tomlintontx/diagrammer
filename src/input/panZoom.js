import { store, markDirty } from '../core/store.js';
import { clamp } from '../core/math.js';
import { getCanvasPos } from '../core/viewport.js';

export function onWheel(e) {
  e.preventDefault();

  if (e.ctrlKey || e.metaKey) {
    const { sx, sy } = getCanvasPos(e);
    const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = clamp(store.vp.zoom * zoomFactor, 0.1, 8);

    store.vp.x = sx - (sx - store.vp.x) * (newZoom / store.vp.zoom);
    store.vp.y = sy - (sy - store.vp.y) * (newZoom / store.vp.zoom);
    store.vp.zoom = newZoom;

    updateZoomIndicator();
  } else {
    store.vp.x -= e.deltaX;
    store.vp.y -= e.deltaY;
  }

  markDirty();
}

export function zoomIn() {
  const cx = store.canvas.width / 2;
  const cy = store.canvas.height / 2;
  const newZoom = clamp(store.vp.zoom * 1.2, 0.1, 8);
  store.vp.x = cx - (cx - store.vp.x) * (newZoom / store.vp.zoom);
  store.vp.y = cy - (cy - store.vp.y) * (newZoom / store.vp.zoom);
  store.vp.zoom = newZoom;
  updateZoomIndicator();
  markDirty();
}

export function zoomOut() {
  const cx = store.canvas.width / 2;
  const cy = store.canvas.height / 2;
  const newZoom = clamp(store.vp.zoom / 1.2, 0.1, 8);
  store.vp.x = cx - (cx - store.vp.x) * (newZoom / store.vp.zoom);
  store.vp.y = cy - (cy - store.vp.y) * (newZoom / store.vp.zoom);
  store.vp.zoom = newZoom;
  updateZoomIndicator();
  markDirty();
}

export function zoomReset() {
  store.vp.zoom = 1;
  store.vp.x = 0;
  store.vp.y = 0;
  updateZoomIndicator();
  markDirty();
}

export function updateZoomIndicator() {
  const el = document.getElementById('zoom-indicator');
  if (el) el.textContent = Math.round(store.vp.zoom * 100) + '%';
}

export function startPan(e) {
  store.isPanning = true;
  store.panStart = { x: e.clientX - store.vp.x, y: e.clientY - store.vp.y };
  store.canvas.style.cursor = 'grabbing';
}

export function endPan() {
  store.isPanning = false;
  store.canvas.style.cursor = store.spaceDown ? 'grab' : 'default';
}

export function handlePanMove(e) {
  store.vp.x = e.clientX - store.panStart.x;
  store.vp.y = e.clientY - store.panStart.y;
  markDirty();
}
