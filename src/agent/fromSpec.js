import { shapeBBox, shapeMidpoints } from '../core/geometry.js';
import { createScene } from './createScene.js';
import { arrow, line, nodeFromSpec } from './shapes.js';

function pickConnectionSides(fromShape, toShape) {
  const fromBB = shapeBBox(fromShape);
  const toBB = shapeBBox(toShape);
  const fromCx = fromBB.x + fromBB.w / 2;
  const fromCy = fromBB.y + fromBB.h / 2;
  const toCx = toBB.x + toBB.w / 2;
  const toCy = toBB.y + toBB.h / 2;
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { fromSide: 'right', toSide: 'left' }
      : { fromSide: 'left', toSide: 'right' };
  }
  return dy > 0
    ? { fromSide: 'bottom', toSide: 'top' }
    : { fromSide: 'top', toSide: 'bottom' };
}

function edgeEndpoints(fromShape, toShape) {
  const sides = pickConnectionSides(fromShape, toShape);
  const fromMp = shapeMidpoints(fromShape)[sides.fromSide];
  const toMp = shapeMidpoints(toShape)[sides.toSide];
  return {
    ...sides,
    x1: fromMp.wx,
    y1: fromMp.wy,
    x2: toMp.wx,
    y2: toMp.wy,
  };
}

function buildEdge(raw, nodeById) {
  const fromId = raw.from ?? raw.fromId;
  const toId = raw.to ?? raw.toId;
  if (!fromId || !toId) {
    throw new Error('Edge requires "from" and "to" node ids');
  }

  const fromShape = nodeById.get(fromId);
  const toShape = nodeById.get(toId);
  if (!fromShape) throw new Error(`Unknown edge source node: ${fromId}`);
  if (!toShape) throw new Error(`Unknown edge target node: ${toId}`);

  const endpoints = edgeEndpoints(fromShape, toShape);
  const type = raw.type === 'line' ? 'line' : 'arrow';
  const connector = type === 'line' ? line : arrow;

  return connector({
    text: raw.label ?? raw.text ?? '',
    x1: raw.x1 ?? endpoints.x1,
    y1: raw.y1 ?? endpoints.y1,
    x2: raw.x2 ?? endpoints.x2,
    y2: raw.y2 ?? endpoints.y2,
    fromShapeId: fromId,
    fromSide: raw.fromSide ?? endpoints.fromSide,
    toShapeId: toId,
    toSide: raw.toSide ?? endpoints.toSide,
    ...(raw.style && typeof raw.style === 'object' ? raw.style : {}),
  });
}

/**
 * Convert an agent-friendly diagram spec into a Diagrammer v2 scene file.
 *
 * Spec formats:
 * - { title, nodes[], edges[] } — nodes and auto-routed connectors
 * - { title, shapes[] } — raw shape objects passed through to the scene
 */
export function fromSpec(spec) {
  if (!spec || typeof spec !== 'object') {
    throw new Error('Spec must be an object');
  }

  const {
    title = 'Untitled',
    backgroundColor = '#f8f9fa',
    viewport = { x: 0, y: 0, zoom: 1 },
    styleDefaults = {},
    nodes,
    edges = [],
    shapes,
  } = spec;

  let builtShapes;

  if (Array.isArray(shapes)) {
    builtShapes = shapes;
  } else if (Array.isArray(nodes)) {
    const nodeShapes = nodes.map((node) => nodeFromSpec(node));
    const nodeById = new Map(nodeShapes.map((s) => [s.id, s]));
    const edgeShapes = edges.map((edge) => buildEdge(edge, nodeById));
    builtShapes = [...nodeShapes, ...edgeShapes];
  } else {
    throw new Error('Spec must include either "nodes" or "shapes"');
  }

  return createScene({
    shapes: builtShapes,
    viewport,
    styleDefaults,
    documentTitle: title,
    backgroundColor,
  });
}
