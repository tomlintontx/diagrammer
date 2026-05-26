import { clamp, dist } from '../core/math.js';
import { shapeBBox, trianglePoints } from '../core/geometry.js';
import { getBBoxResizeHandle, canResizeShape, getLineEndpointHandle, isLineShape } from '../core/resize.js';
import { store } from '../core/store.js';
import { s2w, sl2wl } from '../core/viewport.js';

function pointInTriangle(px, py, [[x0, y0], [x1, y1], [x2, y2]]) {
  const sign = (p1x, p1y, p2x, p2y, p3x, p3y) =>
    (px - p3x) * (p1y - p3y) - (p1x - p3x) * (py - p3y);
  const d1 = sign(x0, y0, x1, y1, x2, y2);
  const d2 = sign(x1, y1, x2, y2, x0, y0);
  const d3 = sign(x2, y2, x0, y0, x1, y1);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(px, py, ax, ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = clamp(t, 0, 1);
  return dist(px, py, ax + t * dx, ay + t * dy);
}

export function hitTest(s, sx, sy) {
  const { wx, wy } = s2w(sx, sy);
  const pad = sl2wl(6);

  switch (s.type) {
    case 'rect':
      return wx >= s.x - pad && wx <= s.x + s.w + pad && wy >= s.y - pad && wy <= s.y + s.h + pad;
    case 'ellipse': {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const rx = s.w / 2 + pad;
      const ry = s.h / 2 + pad;
      return ((wx - cx) ** 2) / rx ** 2 + ((wy - cy) ** 2) / ry ** 2 <= 1;
    }
    case 'diamond': {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const dx = Math.abs(wx - cx) / (s.w / 2 + pad);
      const dy = Math.abs(wy - cy) / (s.h / 2 + pad);
      return dx + dy <= 1;
    }
    case 'triangle': {
      const pts = trianglePoints(s);
      if (pointInTriangle(wx, wy, pts)) return true;
      const threshold = pad + sl2wl(4);
      for (let i = 0; i < 3; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % 3];
        if (distToSegment(wx, wy, ax, ay, bx, by) <= threshold) return true;
      }
      return false;
    }
    case 'arrow':
    case 'line':
      return distToSegment(wx, wy, s.x1, s.y1, s.x2, s.y2) <= pad + sl2wl(4);
    case 'pencil': {
      if (!s.points || s.points.length < 2) return false;
      const threshold = pad + sl2wl(4);
      for (let i = 0; i < s.points.length - 1; i++) {
        const [ax, ay] = s.points[i];
        const [bx, by] = s.points[i + 1];
        if (distToSegment(wx, wy, ax, ay, bx, by) <= threshold) return true;
      }
      return false;
    }
    case 'text': {
      const bb = shapeBBox(s);
      return wx >= bb.x - pad && wx <= bb.x + bb.w + pad && wy >= bb.y - pad && wy <= bb.y + bb.h + pad;
    }
    default:
      return false;
  }
}

export function hitShape(sx, sy) {
  for (let i = store.shapes.length - 1; i >= 0; i--) {
    if (hitTest(store.shapes[i], sx, sy)) return store.shapes[i];
  }
  return null;
}

export function getResizeHandle(s, sx, sy) {
  if (store.selectedIds.size !== 1) return null;
  if (isLineShape(s)) return getLineEndpointHandle(s, sx, sy);
  if (!canResizeShape(s)) return null;
  return getBBoxResizeHandle(shapeBBox(s), sx, sy);
}

export function getGroupResizeHandle(sx, sy) {
  if (store.selectedIds.size < 2) return null;
  const bb = getMultiSelectionBBox();
  if (!bb || bb.w <= 0 || bb.h <= 0) return null;
  return getBBoxResizeHandle(bb, sx, sy, 8);
}

export function getMultiSelectionBBox() {
  const sel = store.shapes.filter((s) => store.selectedIds.has(s.id));
  if (!sel.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of sel) {
    const bb = shapeBBox(s);
    if (bb.x < minX) minX = bb.x;
    if (bb.y < minY) minY = bb.y;
    if (bb.x + bb.w > maxX) maxX = bb.x + bb.w;
    if (bb.y + bb.h > maxY) maxY = bb.y + bb.h;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
