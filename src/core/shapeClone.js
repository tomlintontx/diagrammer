import { uid } from './math.js';

export function cloneShapeWithOffset(shape, offset) {
  const clone = JSON.parse(JSON.stringify(shape));
  clone.id = uid();

  if (shape.type === 'arrow' || shape.type === 'line') {
    clone.x1 += offset;
    clone.y1 += offset;
    clone.x2 += offset;
    clone.y2 += offset;
    clone.fromShapeId = null;
    clone.fromSide = null;
    clone.toShapeId = null;
    clone.toSide = null;
  } else if (shape.type === 'pencil') {
    clone.points = shape.points.map(([px, py]) => [px + offset, py + offset]);
  } else {
    clone.x += offset;
    clone.y += offset;
  }

  return clone;
}
