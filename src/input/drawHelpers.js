/**
 * Snap a world-coord point to 45° increments from an origin when Shift is held.
 */
export function snapTo45(wx, wy, ox, oy) {
  const dx = wx - ox;
  const dy = wy - oy;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { wx, wy };
  const angle = Math.atan2(dy, dx);
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  return {
    wx: ox + len * Math.cos(snapped),
    wy: oy + len * Math.sin(snapped),
  };
}

/**
 * Constrain a rect drag to a square when Shift is held.
 */
export function constrainToSquare(wx, wy, ox, oy) {
  const dx = wx - ox;
  const dy = wy - oy;
  const side = Math.max(Math.abs(dx), Math.abs(dy));
  return {
    wx: ox + Math.sign(dx) * side,
    wy: oy + Math.sign(dy) * side,
  };
}

export function bboxesIntersect(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}
