import { store, markDirty } from '../core/store.js';
import { getCanvasPos, s2w } from '../core/viewport.js';
import { saveHistory } from '../core/history.js';
import { scheduleAutosave } from '../scene/persistence.js';
import { startTextEditInline, supportsInlineText } from '../ui/textEditor.js';
import { showContextMenu, hideContextMenu } from '../ui/contextMenu.js';
import { hitShape } from './hitTest.js';
import { handleSelectMouseDown, handleMoveDrag, updateCursor } from './selectTool.js';
import {
  handleDrawMouseDown,
  handleDrawMove,
  finishDrawing,
  placeTextShape,
  eraseAt,
} from './drawTool.js';
import { handleResizeDrag } from './resizeDrag.js';
import { finishRubberBand, finishEraserBand } from './rubberBand.js';
import {
  onWheel,
  zoomIn,
  zoomOut,
  zoomReset,
  updateZoomIndicator,
  startPan,
  endPan,
  handlePanMove,
} from './panZoom.js';
import { setTool } from './setTool.js';

export { snapTo45, constrainToSquare } from './drawHelpers.js';
export { resetTextToolPlacement } from './textPlacement.js';
export { setTool, zoomIn, zoomOut, zoomReset, updateZoomIndicator };

function getPos(e) {
  return getCanvasPos(e);
}

function onMouseDown(e) {
  if (e.button === 1 || (e.button === 0 && store.spaceDown)) {
    startPan(e);
    return;
  }

  if (e.button === 2) return;

  const { sx, sy } = getPos(e);
  const { wx, wy } = s2w(sx, sy);

  if (store.currentTool === 'select') {
    handleSelectMouseDown(e, sx, sy, wx, wy);
    return;
  }

  handleDrawMouseDown(e, sx, sy, wx, wy);
}

export function onMouseMove(e) {
  const { sx, sy } = getPos(e);
  const { wx, wy } = s2w(sx, sy);

  if (store.isPanning) {
    handlePanMove(e);
    return;
  }

  if (store.isDragging && store.dragMode && store.dragMode.startsWith('resize-')) {
    handleResizeDrag(sx, sy, wx, wy, e.shiftKey);
    return;
  }

  if (store.isDragging && store.dragMode === 'move') {
    handleMoveDrag(sx, sy, wx, wy, e.shiftKey);
    return;
  }

  if (store.isRubberBand) {
    store.rubberBand.x2 = sx;
    store.rubberBand.y2 = sy;
    markDirty();
    return;
  }

  if (store.isDrawing && store.currentShape) {
    handleDrawMove(sx, sy, wx, wy, e.shiftKey);
    return;
  }

  updateCursor(sx, sy);
}

export function onMouseUp(e) {
  const { sx, sy } = getPos(e);

  if (store.isPanning) {
    endPan();
    return;
  }

  if (store.isDragging && store.dragMode && store.dragMode.startsWith('resize-')) {
    store.isDragging = false;
    store.dragMode = null;
    store.resizeTarget = null;
    store.resizeGroupOrig = null;
    store.dragStartShapePositions = {};
    store.arrowSnapPoint = null;
    saveHistory();
    markDirty();
    return;
  }

  if (store.isRubberBand && store.currentTool === 'eraser') {
    finishEraserBand(eraseAt);
    saveHistory();
    scheduleAutosave();
    return;
  }

  if (store.isDragging && store.dragMode === 'move') {
    store.isDragging = false;
    store.dragMode = null;
    store.snapLines = [];
    store.dragStartShapePositions = {};
    saveHistory();
    markDirty();
    return;
  }

  if (store.isRubberBand) {
    finishRubberBand();
    return;
  }

  if (store.isDrawing) {
    finishDrawing();
    return;
  }
}

export { onWheel };

export function onContextMenu(e) {
  e.preventDefault();
  const { sx, sy } = getPos(e);
  const hit = hitShape(sx, sy);
  if (!hit) {
    hideContextMenu();
    return;
  }

  if (!store.selectedIds.has(hit.id)) {
    store.selectedIds = new Set([hit.id]);
    markDirty();
  }

  store.ctxMenuShapeId = hit.id;
  showContextMenu(e.clientX, e.clientY);
}

function onCanvasClick(e) {
  if (store.currentTool !== 'text' || store.spaceDown) return;
  const { sx, sy } = getPos(e);
  const { wx, wy } = s2w(sx, sy);
  placeTextShape(wx, wy);
}

function onGlobalPointerEnd(e) {
  if (!store._pointerActive) return;
  onMouseUp(e);
  store._pointerActive = false;
  window.removeEventListener('pointerup', onGlobalPointerEnd);
  window.removeEventListener('pointercancel', onGlobalPointerEnd);
  try {
    store.canvas.releasePointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
}

function onPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
  store._pointerActive = true;
  try {
    store.canvas.setPointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
  window.addEventListener('pointerup', onGlobalPointerEnd);
  window.addEventListener('pointercancel', onGlobalPointerEnd);
  onMouseDown(e);
}

function onPointerMove(e) {
  onMouseMove(e);
}

function onPointerLeave(_e) {
  onMouseLeave(_e);
}

export function initTools() {
  const c = store.canvas;
  c.addEventListener('pointerdown', onPointerDown);
  c.addEventListener('pointermove', onPointerMove);
  c.addEventListener('pointerleave', onPointerLeave);
  c.addEventListener('click', onCanvasClick);
  c.addEventListener('wheel', onWheel, { passive: false });
  c.addEventListener('contextmenu', onContextMenu);
  c.addEventListener('dblclick', onDblClick);
}

function onMouseLeave(_e) {
  if (store.isPanning) {
    store.isPanning = false;
    store.canvas.style.cursor = 'default';
  }
}

function onDblClick(e) {
  if (store.currentTool !== 'select') return;
  const { sx, sy } = getPos(e);
  const hit = hitShape(sx, sy);
  if (hit && supportsInlineText(hit)) {
    startTextEditInline(hit.id);
  }
}
