import { uid } from './math.js';
import {
  ARROW_DIRECTIONS,
  MAX_SHAPES,
  FILL_STYLES,
  STROKE_STYLES,
  TEXT_ALIGNS,
  TEXT_VERTICAL_ALIGNS,
} from './constants.js';
import {
  clampNumber,
  sanitizeColor,
  sanitizeEnum,
  sanitizeFontFamily,
  sanitizePencilPoints,
  sanitizeText,
} from './validation.js';

const SHAPE_TYPES = new Set([
  'rect', 'ellipse', 'diamond', 'arrow', 'line', 'pencil', 'text',
]);

function styleFields(raw, styleDefaults) {
  return {
    strokeColor: sanitizeColor(raw.strokeColor, styleDefaults.strokeColor),
    fillColor: sanitizeColor(raw.fillColor, styleDefaults.fillColor),
    strokeWidth: clampNumber(raw.strokeWidth, 0.5, 24, styleDefaults.strokeWidth),
    roughness: clampNumber(raw.roughness, 0, 3, styleDefaults.roughness),
    fontSize: clampNumber(raw.fontSize, 8, 128, styleDefaults.fontSize),
    fontFamily: sanitizeFontFamily(raw.fontFamily, styleDefaults.fontFamily),
    textAlign: sanitizeEnum(raw.textAlign, TEXT_ALIGNS, styleDefaults.textAlign),
    textVerticalAlign: sanitizeEnum(
      raw.textVerticalAlign,
      TEXT_VERTICAL_ALIGNS,
      styleDefaults.textVerticalAlign,
    ),
    opacity: clampNumber(raw.opacity, 0, 1, styleDefaults.opacity ?? 1),
    strokeStyle: sanitizeEnum(raw.strokeStyle, STROKE_STYLES, styleDefaults.strokeStyle),
    fillStyle: sanitizeEnum(raw.fillStyle, FILL_STYLES, styleDefaults.fillStyle),
    text: sanitizeText(raw.text),
    seed: clampNumber(raw.seed, 1, 1_000_000, Math.floor(Math.random() * 10000) + 1),
  };
}

export function normalizeShape(raw, styleDefaults) {
  if (!raw || typeof raw !== 'object' || !SHAPE_TYPES.has(raw.type)) {
    return null;
  }

  const base = {
    id: typeof raw.id === 'string' && raw.id.length <= 128 ? raw.id : uid(),
    type: raw.type,
    ...styleFields(raw, styleDefaults),
  };

  switch (raw.type) {
    case 'rect':
    case 'ellipse':
    case 'diamond':
      return {
        ...base,
        x: Number(raw.x) || 0,
        y: Number(raw.y) || 0,
        w: Math.max(0, clampNumber(raw.w, 0, 100_000, 0)),
        h: Math.max(0, clampNumber(raw.h, 0, 100_000, 0)),
      };
    case 'arrow':
    case 'line':
      return {
        ...base,
        fillColor: null,
        x1: Number(raw.x1) || 0,
        y1: Number(raw.y1) || 0,
        x2: Number(raw.x2) || 0,
        y2: Number(raw.y2) || 0,
        arrowDirection: sanitizeEnum(
          raw.arrowDirection,
          ARROW_DIRECTIONS,
          raw.type === 'line' ? 'none' : 'end',
        ),
        fromShapeId: typeof raw.fromShapeId === 'string' ? raw.fromShapeId : null,
        fromSide: typeof raw.fromSide === 'string' ? raw.fromSide : null,
        toShapeId: typeof raw.toShapeId === 'string' ? raw.toShapeId : null,
        toSide: typeof raw.toSide === 'string' ? raw.toSide : null,
      };
    case 'pencil':
      return {
        ...base,
        fillColor: null,
        points: sanitizePencilPoints(raw.points),
      };
    case 'text':
      return {
        ...base,
        fillColor: null,
        x: Number(raw.x) || 0,
        y: Number(raw.y) || 0,
        w: Math.max(10, clampNumber(raw.w, 10, 10_000, 120)),
        h: Math.max(10, clampNumber(raw.h, 10, 10_000, 40)),
      };
    default:
      return null;
  }
}

export function validateAndNormalizeShapes(shapes, styleDefaults) {
  if (!Array.isArray(shapes)) return [];
  return shapes.slice(0, MAX_SHAPES).map((s) => normalizeShape(s, styleDefaults)).filter(Boolean);
}
