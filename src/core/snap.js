import { SNAP_DIST_PX, MOVE_SNAP_PX } from './constants.js';
import { dist } from './math.js';
import { shapeBBox, shapeMidpoints } from './geometry.js';
import { store } from './store.js';
import { w2s } from './viewport.js';

export function findArrowSnap(sx, sy, excludeIds = []) {
  for (let i = store.shapes.length - 1; i >= 0; i--) {
    const s = store.shapes[i];
    if (excludeIds.includes(s.id)) continue;
    const mps = shapeMidpoints(s);
    for (const [side, mp] of Object.entries(mps)) {
      const { sx: mpsx, sy: mpsy } = w2s(mp.wx, mp.wy);
      if (dist(sx, sy, mpsx, mpsy) <= SNAP_DIST_PX) {
        return { wx: mp.wx, wy: mp.wy, shapeId: s.id, side };
      }
    }
  }
  return null;
}

export function updateConnectedArrows(movedShapeId) {
  for (const s of store.shapes) {
    if (s.type !== 'arrow') continue;
    if (s.fromShapeId === movedShapeId) {
      const src = store.shapes.find((sh) => sh.id === movedShapeId);
      if (src) {
        const mps = shapeMidpoints(src);
        const mp = mps[s.fromSide] || mps.right;
        s.x1 = mp.wx;
        s.y1 = mp.wy;
      }
    }
    if (s.toShapeId === movedShapeId) {
      const tgt = store.shapes.find((sh) => sh.id === movedShapeId);
      if (tgt) {
        const mps = shapeMidpoints(tgt);
        const mp = mps[s.toSide] || mps.left;
        s.x2 = mp.wx;
        s.y2 = mp.wy;
      }
    }
  }
}

export function computeMoveSnap(movingIds, proposedPositions) {
  const lines = [];
  const staticShapes = store.shapes.filter((s) => !movingIds.has(s.id));

  const movingBBoxes = [...movingIds]
    .map((id) => {
      const s = store.shapes.find((sh) => sh.id === id);
      if (!s) return null;
      const pp = proposedPositions[id];
      if (pp?.bbox) return pp.bbox;
      const bb = shapeBBox(s);
      if (pp) return { ...bb, x: bb.x + pp.dx, y: bb.y + pp.dy };
      return bb;
    })
    .filter(Boolean);

  if (!movingBBoxes.length || !staticShapes.length) {
    return { snapLines: [], dx: 0, dy: 0 };
  }

  const getXAxes = (bb) => [bb.x, bb.x + bb.w / 2, bb.x + bb.w];
  const getYAxes = (bb) => [bb.y, bb.y + bb.h / 2, bb.y + bb.h];

  let bestDx = null;
  let bestDy = null;

  for (const mbb of movingBBoxes) {
    for (const sbb of staticShapes.map((s) => shapeBBox(s))) {
      for (const mx of getXAxes(mbb)) {
        for (const sx of getXAxes(sbb)) {
          if (Math.abs(mx - sx) < MOVE_SNAP_PX) {
            const d = sx - mx;
            if (bestDx === null || Math.abs(d) < Math.abs(bestDx)) {
              bestDx = d;
              lines.push({ axis: 'x', value: sx });
            }
          }
        }
      }
      for (const my of getYAxes(mbb)) {
        for (const sy of getYAxes(sbb)) {
          if (Math.abs(my - sy) < MOVE_SNAP_PX) {
            const d = sy - my;
            if (bestDy === null || Math.abs(d) < Math.abs(bestDy)) {
              bestDy = d;
              lines.push({ axis: 'y', value: sy });
            }
          }
        }
      }
    }
  }

  return { snapLines: lines, dx: bestDx || 0, dy: bestDy || 0 };
}
