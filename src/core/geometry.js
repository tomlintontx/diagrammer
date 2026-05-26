/** Upward-pointing triangle vertices for a box-shaped shape */
export function trianglePoints(s) {
  return [
    [s.x + s.w / 2, s.y],
    [s.x + s.w, s.y + s.h],
    [s.x, s.y + s.h],
  ];
}

/** Get bounding box of a shape in world coords */
export function shapeBBox(s) {
  switch (s.type) {
    case 'rect':
    case 'ellipse':
    case 'diamond':
    case 'triangle':
      return { x: s.x, y: s.y, w: s.w, h: s.h };
    case 'arrow':
    case 'line': {
      const x = Math.min(s.x1, s.x2);
      const y = Math.min(s.y1, s.y2);
      return { x, y, w: Math.abs(s.x2 - s.x1), h: Math.abs(s.y2 - s.y1) };
    }
    case 'pencil': {
      if (!s.points || s.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const [px, py] of s.points) {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case 'text': {
      return { x: s.x, y: s.y, w: s.w || 120, h: s.h || 40 };
    }
    default:
      return { x: 0, y: 0, w: 0, h: 0 };
  }
}

/** Get edge midpoints of a shape (for arrow snapping) */
export function shapeMidpoints(s) {
  const bb = shapeBBox(s);
  return {
    top: { wx: bb.x + bb.w / 2, wy: bb.y },
    bottom: { wx: bb.x + bb.w / 2, wy: bb.y + bb.h },
    left: { wx: bb.x, wy: bb.y + bb.h / 2 },
    right: { wx: bb.x + bb.w, wy: bb.y + bb.h / 2 },
  };
}

function shapeExportPadding(s) {
  const sw = (s.strokeWidth || 1) * 3;
  if (s.type === 'arrow' || (s.type === 'line' && s.arrowDirection && s.arrowDirection !== 'none')) {
    return sw + 18;
  }
  if (s.type === 'pencil') return sw + 8;
  if (s.type === 'line') return sw + 4;
  return sw + 4;
}

/** Scene bounds with padding for export; optional id filter for selection export */
export function sceneBounds(shapes, pad = 40, onlyIds = null) {
  const list = onlyIds
    ? shapes.filter((s) => onlyIds.has(s.id))
    : shapes;
  if (!list.length) return { minX: 0, minY: 0, width: 200, height: 200 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of list) {
    const bb = shapeBBox(s);
    const ep = shapeExportPadding(s);
    if (bb.x - ep < minX) minX = bb.x - ep;
    if (bb.y - ep < minY) minY = bb.y - ep;
    if (bb.x + bb.w + ep > maxX) maxX = bb.x + bb.w + ep;
    if (bb.y + bb.h + ep > maxY) maxY = bb.y + bb.h + ep;
  }
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.ceil(maxX - minX + pad * 2),
    height: Math.ceil(maxY - minY + pad * 2),
  };
}
