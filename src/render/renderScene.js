import rough from 'roughjs/bundled/rough.esm.js';
import { shapeBBox, trianglePoints } from '../core/geometry.js';
import { drawResizeHandles, drawLineEndpointHandles, isLineShape, isShapeInViewport } from '../core/resize.js';
import {
  fitTextToBox,
  INLINE_TEXT_PADDING_X,
  INLINE_TEXT_PADDING_Y,
  textFont,
  wrapText,
} from '../core/textLayout.js';

function getRoughOptions(s) {
  const opts = {
    stroke: s.strokeColor || '#1e1e1e',
    strokeWidth: s.strokeWidth || 1,
    roughness: s.roughness != null ? s.roughness : 1,
    fill: s.fillColor != null ? s.fillColor : undefined,
    fillStyle: s.fillColor != null ? (s.fillStyle || 'solid') : undefined,
    seed: s.seed || 1,
  };
  if (s.strokeStyle === 'dashed') opts.strokeLineDash = [8, 6];
  if (s.strokeStyle === 'dotted') opts.strokeLineDash = [2, 4];
  return opts;
}

function arrowDirection(s) {
  if (s.arrowDirection) return s.arrowDirection;
  return s.type === 'line' ? 'none' : 'end';
}

function drawArrowhead(ctx, s, atStart = false) {
  const tipX = atStart ? s.x1 : s.x2;
  const tipY = atStart ? s.y1 : s.y2;
  const tailX = atStart ? s.x2 : s.x1;
  const tailY = atStart ? s.y2 : s.y1;
  const dx = tipX - tailX;
  const dy = tipY - tailY;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len;
  const uy = dy / len;
  const size = 12 + (s.strokeWidth || 1) * 2;
  const angle = 0.45;
  const ax1 = tipX - size * (ux * Math.cos(angle) - uy * Math.sin(angle));
  const ay1 = tipY - size * (uy * Math.cos(angle) + ux * Math.sin(angle));
  const ax2 = tipX - size * (ux * Math.cos(-angle) - uy * Math.sin(-angle));
  const ay2 = tipY - size * (uy * Math.cos(-angle) + ux * Math.sin(-angle));

  ctx.save();
  ctx.strokeStyle = s.strokeColor || '#1e1e1e';
  ctx.lineWidth = s.strokeWidth || 1;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax1, ay1);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(ax2, ay2);
  ctx.stroke();
  ctx.restore();
}

function drawArrowheads(ctx, s) {
  const direction = arrowDirection(s);
  if (direction === 'start' || direction === 'both') drawArrowhead(ctx, s, true);
  if (direction === 'end' || direction === 'both') drawArrowhead(ctx, s, false);
}

function drawStandaloneText(ctx, s) {
  if (!s.text) return;
  const fontSize = s.fontSize || 24;
  const padX = Math.min(INLINE_TEXT_PADDING_X, Math.max(4, (s.w || 200) / 8));
  const padY = Math.min(INLINE_TEXT_PADDING_Y, Math.max(4, (s.h || 40) / 8));
  const maxWidth = Math.max(10, (s.w || 200) - padX * 2);
  const lineHeight = fontSize * 1.35;
  const textX = inlineTextX(s, padX, 'left');
  const lines = wrapText(ctx, s.text, maxWidth, textFont(s, fontSize));
  const totalHeight = lines.length * lineHeight;
  let startY = s.y + Math.max(padY, ((s.h || 40) - totalHeight) / 2);
  if (s.textVerticalAlign === 'top') startY = s.y + padY;
  if (s.textVerticalAlign === 'bottom') {
    startY = s.y + (s.h || 40) - padY - totalHeight;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w || 200, s.h || Math.max(40, lineHeight));
  ctx.clip();
  ctx.globalAlpha = s.opacity != null ? s.opacity : 1;
  ctx.font = textFont(s, fontSize);
  ctx.fillStyle = s.strokeColor || '#1e1e1e';
  ctx.textBaseline = 'top';
  ctx.textAlign = s.textAlign || 'left';
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, startY + i * lineHeight, maxWidth);
  });
  ctx.restore();
}

function inlineTextX(s, padX, defaultAlign = 'center') {
  const align = s.textAlign || defaultAlign;
  if (align === 'left') return s.x + padX;
  if (align === 'right') return s.x + s.w - padX;
  return s.x + s.w / 2;
}

function inlineTextStartY(s, padY, fit) {
  const align = s.textVerticalAlign || 'middle';
  if (align === 'top') return s.y + padY + fit.lineHeight / 2;
  if (align === 'bottom') return s.y + s.h - padY - fit.totalHeight + fit.lineHeight / 2;
  return s.y + s.h / 2 - fit.totalHeight / 2 + fit.lineHeight / 2;
}

function drawShapeInlineText(ctx, s) {
  if (!s.text) return;
  const padX = Math.min(INLINE_TEXT_PADDING_X, Math.max(4, (s.w || 100) / 8));
  const padY = Math.min(INLINE_TEXT_PADDING_Y, Math.max(4, (s.h || 60) / 8));
  const maxWidth = Math.max(10, (s.w || 100) - padX * 2);
  const maxHeight = Math.max(10, (s.h || 60) - padY * 2);
  const fit = fitTextToBox(ctx, s, s.text, maxWidth, maxHeight);
  const textX = inlineTextX(s, padX);
  const startY = inlineTextStartY(s, padY, fit);

  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x + padX / 2, s.y + padY / 2, s.w - padX, s.h - padY);
  ctx.clip();
  ctx.globalAlpha = s.opacity != null ? s.opacity : 1;
  ctx.font = fit.font;
  ctx.fillStyle = s.strokeColor || '#1e1e1e';
  ctx.textAlign = s.textAlign || 'center';
  ctx.textBaseline = 'middle';
  fit.lines.forEach((line, i) => {
    ctx.fillText(line, textX, startY + i * fit.lineHeight, maxWidth);
  });
  ctx.restore();
}

/** Draw one shape; ctx must already be in world space */
export function drawShape(ctx, rc, s) {
  if (!rc) return;
  const opts = getRoughOptions(s);
  ctx.save();
  ctx.globalAlpha = s.opacity != null ? s.opacity : 1;

  switch (s.type) {
    case 'rect':
      rc.rectangle(s.x, s.y, s.w, s.h, opts);
      if (s.text) drawShapeInlineText(ctx, s);
      break;
    case 'ellipse':
      rc.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h, opts);
      if (s.text) drawShapeInlineText(ctx, s);
      break;
    case 'diamond': {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const pts = [
        [cx, s.y],
        [s.x + s.w, cy],
        [cx, s.y + s.h],
        [s.x, cy],
      ];
      rc.polygon(pts, opts);
      if (s.text) drawShapeInlineText(ctx, s);
      break;
    }
    case 'triangle':
      rc.polygon(trianglePoints(s), opts);
      if (s.text) drawShapeInlineText(ctx, s);
      break;
    case 'arrow':
    case 'line':
      rc.line(s.x1, s.y1, s.x2, s.y2, opts);
      drawArrowheads(ctx, s);
      break;
    case 'pencil':
      if (s.points && s.points.length >= 2) {
        rc.linearPath(s.points, { ...opts, fill: undefined, fillStyle: undefined });
      }
      break;
    case 'text':
      drawStandaloneText(ctx, s);
      break;
    default:
      break;
  }
  ctx.restore();
}

export function drawGrid(ctx, canvasWidth, canvasHeight, viewport) {
  const spacing = 24 * viewport.zoom;
  if (spacing < 6) return;
  const dotR = Math.max(0.5, viewport.zoom * 0.8);
  const startX = ((viewport.x % spacing) + spacing) % spacing;
  const startY = ((viewport.y % spacing) + spacing) % spacing;

  ctx.save();
  ctx.fillStyle = '#c8c8d0';
  for (let x = startX; x < canvasWidth; x += spacing) {
    for (let y = startY; y < canvasHeight; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function w2sLocal(wx, wy, vp) {
  return { sx: wx * vp.zoom + vp.x, sy: wy * vp.zoom + vp.y };
}

export function drawSelectionBox(ctx, s, selectedCount, vp) {
  const bb = shapeBBox(s);
  const { sx: x1, sy: y1 } = w2sLocal(bb.x, bb.y, vp);
  const { sx: x2, sy: y2 } = w2sLocal(bb.x + bb.w, bb.y + bb.h, vp);
  const pad = 6;

  ctx.save();
  ctx.strokeStyle = '#1a73e8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2);
  ctx.setLineDash([]);

  ctx.restore();

  if (selectedCount === 1) {
    if (isLineShape(s)) {
      drawLineEndpointHandles(ctx, s);
    } else {
      drawResizeHandles(ctx, bb, pad);
    }
  }
}

export function drawMultiSelectionBox(ctx, bb, vp, showHandles = true) {
  const { sx: x1, sy: y1 } = w2sLocal(bb.x, bb.y, vp);
  const { sx: x2, sy: y2 } = w2sLocal(bb.x + bb.w, bb.y + bb.h, vp);
  const pad = 8;
  ctx.save();
  ctx.strokeStyle = '#1a73e8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2);
  ctx.setLineDash([]);
  ctx.restore();
  if (showHandles && bb.w > 0 && bb.h > 0) {
    drawResizeHandles(ctx, bb, pad);
  }
}

/**
 * Pure scene render — does not mutate global app state.
 */
export function renderScene({
  ctx,
  rc,
  canvasWidth,
  canvasHeight,
  shapes,
  viewport,
  currentShape = null,
  backgroundColor = '#f8f9fa',
  showGrid = true,
  cullOffscreen = false,
}) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (showGrid) drawGrid(ctx, canvasWidth, canvasHeight, viewport);

  ctx.save();
  ctx.translate(viewport.x, viewport.y);
  ctx.scale(viewport.zoom, viewport.zoom);

  for (const s of shapes) {
    if (cullOffscreen && !isShapeInViewport(s, viewport, canvasWidth, canvasHeight)) continue;
    drawShape(ctx, rc, s);
  }
  if (currentShape) drawShape(ctx, rc, currentShape);

  ctx.restore();
}

/** Render shapes to an offscreen canvas for PNG export */
export function renderSceneToCanvas(shapes, bounds) {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = bounds.width;
  offCanvas.height = bounds.height;
  const offCtx = offCanvas.getContext('2d');
  const rc = rough.canvas(offCanvas);

  renderScene({
    ctx: offCtx,
    rc,
    canvasWidth: bounds.width,
    canvasHeight: bounds.height,
    shapes,
    viewport: { x: -bounds.minX, y: -bounds.minY, zoom: 1 },
    showGrid: false,
    backgroundColor: '#ffffff',
  });

  return offCanvas;
}
