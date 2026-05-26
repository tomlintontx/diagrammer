import { store, markDirty } from '../core/store.js';
import { sl2wl } from '../core/viewport.js';
import { snapshotShapeGeometry } from '../core/resize.js';
import { duplicateSelected } from '../core/commands.js';
import { computeMoveSnap, updateConnectedArrows } from '../core/snap.js';
import { startTextEditInline, supportsInlineText } from '../ui/textEditor.js';
import {
  hitShape,
  getResizeHandle,
  getGroupResizeHandle,
  getMultiSelectionBBox,
} from './hitTest.js';

const DBL_CLICK_MS = 300;
let lastClickTime = 0;
let lastClickShapeId = null;

function isAdditiveSelectionEvent(e) {
  return e.shiftKey || e.metaKey || e.ctrlKey;
}

export function startGroupResize(handle, sx, sy) {
  const bb = getMultiSelectionBBox();
  if (!bb) return;
  store.dragMode = 'resize-group-' + handle;
  store.resizeTarget = null;
  store.dragStartPos = { x: sx, y: sy };
  store.resizeGroupOrig = {
    group: { ...bb },
    shapes: [...store.selectedIds]
      .map((id) => {
        const shape = store.shapes.find((sh) => sh.id === id);
        return shape ? { shape, orig: snapshotShapeGeometry(shape) } : null;
      })
      .filter(Boolean),
  };
  store.isDragging = true;
}

export function handleSelectMouseDown(e, sx, sy, _wx, _wy) {
  const now = Date.now();
  const hit = hitShape(sx, sy);

  if (now - lastClickTime < DBL_CLICK_MS && hit && hit.id === lastClickShapeId) {
    lastClickTime = 0;
    lastClickShapeId = null;
    if (supportsInlineText(hit)) {
      startTextEditInline(hit.id);
    }
    return;
  }

  lastClickTime = now;
  lastClickShapeId = hit ? hit.id : null;

  if (store.selectedIds.size > 1) {
    const gHandle = getGroupResizeHandle(sx, sy);
    if (gHandle) {
      startGroupResize(gHandle, sx, sy);
      return;
    }
  }

  if (hit) {
    if (store.selectedIds.size === 1 && store.selectedIds.has(hit.id)) {
      const handle = getResizeHandle(hit, sx, sy);
      if (handle) {
        store.dragMode = 'resize-' + handle;
        store.resizeTarget = hit;
        store.dragStartPos = { x: sx, y: sy };
        store.dragStartShapePositions = {
          [hit.id]: snapshotShapeGeometry(hit),
        };
        store.isDragging = true;
        return;
      }
    }

    const additiveSelection = isAdditiveSelectionEvent(e);
    if (additiveSelection) {
      if (store.selectedIds.has(hit.id)) {
        store.selectedIds.delete(hit.id);
      } else {
        store.selectedIds.add(hit.id);
      }
    } else if (!store.selectedIds.has(hit.id)) {
      store.selectedIds = new Set([hit.id]);
    }

    if (additiveSelection) {
      store.isDragging = false;
      markDirty();
      return;
    }

    store.dragMode = 'move';
    store.dragStartPos = { x: sx, y: sy };
    store.dragStartShapePositions = {};
    for (const id of store.selectedIds) {
      const s = store.shapes.find((sh) => sh.id === id);
      if (!s) continue;
      store.dragStartShapePositions[id] = snapshotShapeGeometry(s);
    }
    if (e.altKey) {
      duplicateSelected();
      store.dragStartShapePositions = {};
      for (const id of store.selectedIds) {
        const s = store.shapes.find((sh) => sh.id === id);
        if (!s) continue;
        store.dragStartShapePositions[id] = snapshotShapeGeometry(s);
      }
    }

    store.isDragging = true;
    markDirty();
  } else {
    if (!isAdditiveSelectionEvent(e)) store.selectedIds.clear();
    store.isRubberBand = true;
    store.rubberBand = { x1: sx, y1: sy, x2: sx, y2: sy };
    markDirty();
  }
}

export function handleMoveDrag(sx, sy, _wx, _wy, _shiftKey) {
  const dsx = sx - store.dragStartPos.x;
  const dsy = sy - store.dragStartPos.y;
  const dwx = sl2wl(dsx);
  const dwy = sl2wl(dsy);

  const proposedPositions = {};
  for (const id of store.selectedIds) {
    proposedPositions[id] = { dx: dwx, dy: dwy };
  }
  const { snapLines: sl, dx: snapDx, dy: snapDy } = computeMoveSnap(store.selectedIds, proposedPositions);
  store.snapLines = sl;

  const finalDwx = dwx + snapDx;
  const finalDwy = dwy + snapDy;

  for (const id of store.selectedIds) {
    const s = store.shapes.find((sh) => sh.id === id);
    const orig = store.dragStartShapePositions[id];
    if (!s || !orig) continue;

    if (s.type === 'arrow' || s.type === 'line') {
      s.x1 = orig.x1 + finalDwx;
      s.y1 = orig.y1 + finalDwy;
      s.x2 = orig.x2 + finalDwx;
      s.y2 = orig.y2 + finalDwy;
    } else if (s.type === 'pencil') {
      s.points = orig.points.map(([px, py]) => [px + finalDwx, py + finalDwy]);
    } else {
      s.x = orig.x + finalDwx;
      s.y = orig.y + finalDwy;
    }

    updateConnectedArrows(id);
  }

  markDirty();
}

export function updateCursor(sx, sy) {
  if (store.currentTool !== 'select') {
    store.canvas.style.cursor = 'crosshair';
    return;
  }

  if (store.spaceDown) {
    store.canvas.style.cursor = 'grab';
    return;
  }

  if (store.selectedIds.size > 1) {
    const gHandle = getGroupResizeHandle(sx, sy);
    if (gHandle) {
      const cursors = {
        nw: 'nw-resize', n: 'ns-resize', ne: 'ne-resize', e: 'ew-resize',
        se: 'se-resize', s: 'ns-resize', sw: 'sw-resize', w: 'ew-resize',
      };
      store.canvas.style.cursor = cursors[gHandle] || 'default';
      return;
    }
  }

  const hit = hitShape(sx, sy);
  if (hit && store.selectedIds.size === 1 && store.selectedIds.has(hit.id)) {
    const handle = getResizeHandle(hit, sx, sy);
    if (handle) {
      if (handle === 'start' || handle === 'end') {
        store.canvas.style.cursor = 'grab';
        return;
      }
      const cursors = {
        nw: 'nw-resize', n: 'ns-resize', ne: 'ne-resize', e: 'ew-resize',
        se: 'se-resize', s: 'ns-resize', sw: 'sw-resize', w: 'ew-resize',
      };
      store.canvas.style.cursor = cursors[handle] || 'default';
      return;
    }
  }
  store.canvas.style.cursor = hit ? 'move' : 'default';
}
