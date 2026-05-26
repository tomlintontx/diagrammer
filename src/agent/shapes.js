import { uid } from '../core/math.js';

const DEFAULT_STYLE = {
  strokeColor: '#1e1e1e',
  fillColor: '#ffffff',
  strokeWidth: 1,
  roughness: 1,
  fontSize: 24,
  fontFamily: 'Caveat',
  textAlign: 'center',
  opacity: 1,
  strokeStyle: 'solid',
  fillStyle: 'solid',
};

function baseShape(type, props = {}) {
  const { id, text, style = {}, ...rest } = props;
  return {
    id: id ?? uid(),
    type,
    text: text ?? '',
    seed: Math.floor(Math.random() * 10000) + 1,
    ...DEFAULT_STYLE,
    ...style,
    ...rest,
  };
}

export function rect(props) {
  const { x = 0, y = 0, w = 120, h = 60, ...rest } = props;
  return baseShape('rect', { x, y, w, h, ...rest });
}

export function ellipse(props) {
  const { x = 0, y = 0, w = 120, h = 60, ...rest } = props;
  return baseShape('ellipse', { x, y, w, h, ...rest });
}

export function diamond(props) {
  const { x = 0, y = 0, w = 120, h = 60, ...rest } = props;
  return baseShape('diamond', { x, y, w, h, ...rest });
}

export function textShape(props) {
  const { x = 0, y = 0, w = 120, h = 40, ...rest } = props;
  return baseShape('text', { x, y, w, h, fillColor: null, ...rest });
}

export function line(props) {
  const {
    x1 = 0, y1 = 0, x2 = 100, y2 = 0,
    fromShapeId = null, fromSide = null,
    toShapeId = null, toSide = null,
    ...rest
  } = props;
  return baseShape('line', {
    x1, y1, x2, y2,
    fillColor: null,
    fromShapeId, fromSide, toShapeId, toSide,
    ...rest,
  });
}

export function arrow(props) {
  const {
    x1 = 0, y1 = 0, x2 = 100, y2 = 0,
    fromShapeId = null, fromSide = null,
    toShapeId = null, toSide = null,
    ...rest
  } = props;
  return baseShape('arrow', {
    x1, y1, x2, y2,
    fillColor: null,
    fromShapeId, fromSide, toShapeId, toSide,
    ...rest,
  });
}

export function pencil(props) {
  const { points = [], ...rest } = props;
  return baseShape('pencil', { points, fillColor: null, ...rest });
}

export function nodeFromSpec(raw) {
  const type = raw.type === 'label' ? 'text' : (raw.type ?? 'rect');
  const text = raw.label ?? raw.text ?? '';
  const style = raw.style && typeof raw.style === 'object' ? raw.style : {};
  const common = {
    id: raw.id,
    text,
    style,
    ...(raw.style ? {} : {}),
  };

  switch (type) {
    case 'rect':
    case 'ellipse':
    case 'diamond':
      return baseShape(type, {
        id: common.id,
        x: raw.x ?? 0,
        y: raw.y ?? 0,
        w: raw.w ?? 120,
        h: raw.h ?? 60,
        text,
        ...style,
      });
    case 'text':
      return baseShape('text', {
        id: common.id,
        x: raw.x ?? 0,
        y: raw.y ?? 0,
        w: raw.w ?? 120,
        h: raw.h ?? 40,
        text,
        fillColor: null,
        ...style,
      });
    default:
      throw new Error(`Unsupported node type: ${raw.type}`);
  }
}
