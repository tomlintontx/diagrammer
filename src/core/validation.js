import {
  ARROW_DIRECTIONS,
  FILL_STYLES,
  FONT_FAMILIES,
  MAX_IMAGE_DATA_URL_LENGTH,
  MAX_PENCIL_POINTS,
  MAX_TEXT_LENGTH,
  STROKE_STYLES,
  TEXT_ALIGNS,
  TEXT_VERTICAL_ALIGNS,
} from './constants.js';

const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|none|[a-zA-Z]+)$/;
const IMAGE_DATA_URL_RE = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i;

export function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeColor(value, fallback) {
  if (value == null) return fallback;
  const s = String(value).trim();
  if (s.length > 64 || !COLOR_RE.test(s)) return fallback;
  return s;
}

export function sanitizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function sanitizeFontFamily(value, fallback) {
  return sanitizeEnum(value, FONT_FAMILIES, fallback);
}

export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value.slice(0, MAX_TEXT_LENGTH);
}

export function sanitizeImageSrc(value) {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  if (s.length > MAX_IMAGE_DATA_URL_LENGTH) return '';
  return IMAGE_DATA_URL_RE.test(s) ? s : '';
}

export function sanitizeStyleDefaults(raw, defaults) {
  const merged = { ...defaults, ...(raw && typeof raw === 'object' ? raw : {}) };
  return {
    strokeColor: sanitizeColor(merged.strokeColor, defaults.strokeColor),
    fillColor: sanitizeColor(merged.fillColor, defaults.fillColor),
    strokeWidth: clampNumber(merged.strokeWidth, 0.5, 24, defaults.strokeWidth),
    roughness: clampNumber(merged.roughness, 0, 3, defaults.roughness),
    fontSize: clampNumber(merged.fontSize, 8, 128, defaults.fontSize),
    fontFamily: sanitizeFontFamily(merged.fontFamily, defaults.fontFamily),
    textAlign: sanitizeEnum(merged.textAlign, TEXT_ALIGNS, defaults.textAlign),
    textVerticalAlign: sanitizeEnum(
      merged.textVerticalAlign,
      TEXT_VERTICAL_ALIGNS,
      defaults.textVerticalAlign,
    ),
    opacity: clampNumber(merged.opacity, 0, 1, defaults.opacity),
    strokeStyle: sanitizeEnum(merged.strokeStyle, STROKE_STYLES, defaults.strokeStyle),
    fillStyle: sanitizeEnum(merged.fillStyle, FILL_STYLES, defaults.fillStyle),
    arrowDirection: sanitizeEnum(
      merged.arrowDirection,
      ARROW_DIRECTIONS,
      defaults.arrowDirection ?? 'end',
    ),
  };
}

export function sanitizeBackgroundColor(value, fallback) {
  return sanitizeColor(value, fallback);
}

export function sanitizePencilPoints(points) {
  if (!Array.isArray(points)) return [];
  return points
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .slice(0, MAX_PENCIL_POINTS)
    .map((p) => [Number(p[0]) || 0, Number(p[1]) || 0]);
}
