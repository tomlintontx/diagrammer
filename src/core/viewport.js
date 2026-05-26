import { store } from './store.js';

export function s2w(sx, sy) {
  const { vp } = store;
  return {
    wx: (sx - vp.x) / vp.zoom,
    wy: (sy - vp.y) / vp.zoom,
  };
}

export function w2s(wx, wy) {
  const { vp } = store;
  return {
    sx: wx * vp.zoom + vp.x,
    sy: wy * vp.zoom + vp.y,
  };
}

export function wl2sl(len) {
  return len * store.vp.zoom;
}

export function sl2wl(len) {
  return len / store.vp.zoom;
}

export function getCanvasPos(e) {
  const r = store.canvas.getBoundingClientRect();
  return { sx: e.clientX - r.left, sy: e.clientY - r.top };
}
