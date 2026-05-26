import { HANDLE_SIZE } from './constants.js';
import { shapeBBox } from './geometry.js';
import { w2s } from './viewport.js';

/** Screen-space resize handles for a world bbox */
export function getBBoxResizeHandles(bb, pad = 6) {
  const { sx: x1, sy: y1 } = w2s(bb.x, bb.y);
  const { sx: x2, sy: y2 } = w2s(bb.x + bb.w, bb.y + bb.h);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return [
    { name: 'nw', cx: x1 - pad, cy: y1 - pad },
    { name: 'n', cx: mx, cy: y1 - pad },
    { name: 'ne', cx: x2 + pad, cy: y1 - pad },
    { name: 'e', cx: x2 + pad, cy: my },
    { name: 'se', cx: x2 + pad, cy: y2 + pad },
    { name: 's', cx: mx, cy: y2 + pad },
    { name: 'sw', cx: x1 - pad, cy: y2 + pad },
    { name: 'w', cx: x1 - pad, cy: my },
  ];
}

export function getBBoxResizeHandle(bb, sx, sy, pad = 6) {
  for (const h of getBBoxResizeHandles(bb, pad)) {
    if (Math.abs(sx - h.cx) <= HANDLE_SIZE && Math.abs(sy - h.cy) <= HANDLE_SIZE) {
      return h.name;
    }
  }
  return null;
}

const RESIZABLE_TYPES = new Set(['rect', 'ellipse', 'diamond', 'text']);

export function isLineShape(s) {
  return s.type === 'arrow' || s.type === 'line';
}

export function canResizeShape(s) {
  return RESIZABLE_TYPES.has(s.type);
}

/** Screen-space handles at line/arrow endpoints */
export function getLineEndpointHandles(s) {
  const p1 = w2s(s.x1, s.y1);
  const p2 = w2s(s.x2, s.y2);
  return [
    { name: 'start', cx: p1.sx, cy: p1.sy },
    { name: 'end', cx: p2.sx, cy: p2.sy },
  ];
}

export function getLineEndpointHandle(s, sx, sy) {
  for (const h of getLineEndpointHandles(s)) {
    if (Math.abs(sx - h.cx) <= HANDLE_SIZE && Math.abs(sy - h.cy) <= HANDLE_SIZE) {
      return h.name;
    }
  }
  return null;
}

export function drawLineEndpointHandles(ctx, s) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1a73e8';
  ctx.lineWidth = 1.5;
  for (const h of getLineEndpointHandles(s)) {
    ctx.beginPath();
    ctx.arc(h.cx, h.cy, HANDLE_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** Apply 8-handle resize to a box shape from original geometry */
export function applyBoxResize(orig, handle, wx, wy, shiftKey) {
  let { x, y, w, h } = orig;
  const right = x + w;
  const bottom = y + h;

  switch (handle) {
    case 'nw':
      x = wx;
      y = wy;
      w = right - wx;
      h = bottom - wy;
      break;
    case 'n':
      y = wy;
      h = bottom - wy;
      break;
    case 'ne':
      y = wy;
      w = wx - x;
      h = bottom - wy;
      break;
    case 'e':
      w = wx - x;
      break;
    case 'se':
      w = wx - x;
      h = wy - y;
      break;
    case 's':
      h = wy - y;
      break;
    case 'sw':
      x = wx;
      w = right - wx;
      h = wy - y;
      break;
    case 'w':
      x = wx;
      w = right - wx;
      break;
    default:
      break;
  }

  if (shiftKey && ['nw', 'ne', 'sw', 'se'].includes(handle)) {
    const side = Math.max(Math.abs(w), Math.abs(h));
    if (handle.includes('w')) x = right - side;
    if (handle.includes('n')) y = bottom - side;
    w = side;
    h = side;
  }

  if (w < 10) {
    if (handle.includes('w')) x = right - 10;
    w = 10;
  }
  if (h < 10) {
    if (handle.includes('n')) y = bottom - 10;
    h = 10;
  }

  return { x, y, w, h };
}

/** Scale all shapes in a group resize from original group bbox + per-shape snapshots */
export function applyGroupResize(origGroup, origShapes, handle, wx, wy) {
  const resized = applyBoxResize(origGroup, handle, wx, wy, false);
  const scaleX = origGroup.w ? resized.w / origGroup.w : 1;
  const scaleY = origGroup.h ? resized.h / origGroup.h : 1;
  const ox = origGroup.x;
  const oy = origGroup.y;

  for (const snap of origShapes) {
    const s = snap.shape;
    const o = snap.orig;
    if (s.type === 'arrow' || s.type === 'line') {
      s.x1 = resized.x + (o.x1 - ox) * scaleX;
      s.y1 = resized.y + (o.y1 - oy) * scaleY;
      s.x2 = resized.x + (o.x2 - ox) * scaleX;
      s.y2 = resized.y + (o.y2 - oy) * scaleY;
    } else if (s.type === 'pencil') {
      s.points = o.points.map(([px, py]) => [
        resized.x + (px - ox) * scaleX,
        resized.y + (py - oy) * scaleY,
      ]);
    } else if (o.x != null) {
      s.x = resized.x + (o.x - ox) * scaleX;
      s.y = resized.y + (o.y - oy) * scaleY;
      if (o.w != null) s.w = o.w * scaleX;
      if (o.h != null) s.h = o.h * scaleY;
    }
  }
}

export function snapshotShapeGeometry(s) {
  if (s.type === 'arrow' || s.type === 'line') {
    return { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 };
  }
  if (s.type === 'pencil') {
    return { points: s.points.map((p) => [...p]) };
  }
  return { x: s.x, y: s.y, w: s.w, h: s.h };
}

export function drawResizeHandles(ctx, bb, pad = 6) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1a73e8';
  ctx.lineWidth = 1.5;
  for (const h of getBBoxResizeHandles(bb, pad)) {
    ctx.beginPath();
    ctx.rect(h.cx - HANDLE_SIZE / 2, h.cy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function isShapeInViewport(s, vp, canvasWidth, canvasHeight, margin = 80) {
  const bb = shapeBBox(s);
  const { sx: x1, sy: y1 } = w2s(bb.x, bb.y);
  const { sx: x2, sy: y2 } = w2s(bb.x + bb.w, bb.y + bb.h);
  return x2 >= -margin && y2 >= -margin && x1 <= canvasWidth + margin && y1 <= canvasHeight + margin;
}
