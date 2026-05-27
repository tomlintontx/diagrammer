import { uid } from './math.js';

export function cloneShapeWithOffset(shape, dx, dy) {
  const ox = dx;
  const oy = dy === undefined ? dx : dy;
  const clone = JSON.parse(JSON.stringify(shape));
  clone.id = uid();

  if (shape.type === 'arrow' || shape.type === 'line') {
    clone.x1 += ox;
    clone.y1 += oy;
    clone.x2 += ox;
    clone.y2 += oy;
    clone.fromShapeId = null;
    clone.fromSide = null;
    clone.toShapeId = null;
    clone.toSide = null;
  } else if (shape.type === 'pencil') {
    clone.points = shape.points.map(([px, py]) => [px + ox, py + oy]);
  } else {
    clone.x += ox;
    clone.y += oy;
  }

  return clone;
}
