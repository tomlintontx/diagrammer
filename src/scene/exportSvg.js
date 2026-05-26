import {
  fitTextToBox,
  INLINE_TEXT_PADDING_X,
  INLINE_TEXT_PADDING_Y,
  textFont,
  wrapText,
} from '../core/textLayout.js';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeId(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function getMeasureContext() {
  if (typeof document !== 'undefined') {
    return document.createElement('canvas').getContext('2d');
  }
  return {
    font: '',
    measureText(text) {
      const size = Number.parseFloat(this.font) || 18;
      return { width: String(text).length * size * 0.6 };
    },
  };
}

function inlineTextX(s, padX, ox, defaultAlign = 'center') {
  const align = s.textAlign || defaultAlign;
  if (align === 'left') return s.x + padX + ox;
  if (align === 'right') return s.x + s.w - padX + ox;
  return s.x + s.w / 2 + ox;
}

function inlineTextStartY(s, padY, fit, oy) {
  const align = s.textVerticalAlign || 'middle';
  if (align === 'top') return s.y + padY + fit.lineHeight / 2 + oy;
  if (align === 'bottom') return s.y + s.h - padY - fit.totalHeight + fit.lineHeight / 2 + oy;
  return s.y + s.h / 2 - fit.totalHeight / 2 + fit.lineHeight / 2 + oy;
}

function svgTextAnchor(align) {
  if (align === 'left') return 'start';
  if (align === 'right') return 'end';
  return 'middle';
}

function inlineTextSvg(s, ox, oy) {
  if (!s.text) return '';
  const padX = Math.min(INLINE_TEXT_PADDING_X, Math.max(4, (s.w || 100) / 8));
  const padY = Math.min(INLINE_TEXT_PADDING_Y, Math.max(4, (s.h || 60) / 8));
  const fit = fitTextToBox(
    getMeasureContext(),
    s,
    s.text,
    Math.max(10, (s.w || 100) - padX * 2),
    Math.max(10, (s.h || 60) - padY * 2),
  );
  const textX = inlineTextX(s, padX, ox);
  const startY = inlineTextStartY(s, padY, fit, oy);
  const anchor = svgTextAnchor(s.textAlign || 'center');
  const fill = esc(s.strokeColor || '#1e1e1e');
  const opacity = esc(s.opacity != null ? s.opacity : 1);
  const ff = esc(s.fontFamily || 'Caveat');
  return fit.lines
    .map((line, i) => (
      `<text x="${esc(textX)}" y="${esc(startY + i * fit.lineHeight)}" font-size="${esc(fit.fontSize)}" font-family="${ff}" fill="${fill}" opacity="${opacity}" text-anchor="${anchor}" dominant-baseline="middle">${esc(line)}</text>`
    ))
    .join('\n');
}

function standaloneTextSvg(s, ox, oy) {
  if (!s.text) return '';
  const fontSize = s.fontSize || 24;
  const padX = Math.min(INLINE_TEXT_PADDING_X, Math.max(4, (s.w || 200) / 8));
  const padY = Math.min(INLINE_TEXT_PADDING_Y, Math.max(4, (s.h || 40) / 8));
  const maxWidth = Math.max(10, (s.w || 200) - padX * 2);
  const lineHeight = fontSize * 1.35;
  const lines = wrapText(getMeasureContext(), s.text, maxWidth, textFont(s, fontSize));
  const totalHeight = lines.length * lineHeight;
  const textX = inlineTextX(s, padX, ox, 'left');
  let startY = s.y + oy + Math.max(padY, ((s.h || 40) - totalHeight) / 2);
  if (s.textVerticalAlign === 'top') startY = s.y + oy + padY;
  if (s.textVerticalAlign === 'bottom') {
    startY = s.y + oy + (s.h || 40) - padY - totalHeight;
  }
  const clipId = `clip-${safeId(s.id || `text-${s.x}-${s.y}`)}`;
  const anchor = svgTextAnchor(s.textAlign || 'left');
  const fill = esc(s.strokeColor || '#1e1e1e');
  const opacity = esc(s.opacity != null ? s.opacity : 1);
  const ff = esc(s.fontFamily || 'Caveat');
  const text = lines
    .map((line, i) => (
      `<text x="${esc(textX)}" y="${esc(startY + i * lineHeight)}" font-size="${esc(fontSize)}" font-family="${ff}" fill="${fill}" opacity="${opacity}" text-anchor="${anchor}">${esc(line)}</text>`
    ))
    .join('\n');
  return [
    `<clipPath id="${clipId}"><rect x="${esc(s.x + ox)}" y="${esc(s.y + oy)}" width="${esc(s.w || 200)}" height="${esc(s.h || 40)}"/></clipPath>`,
    `<g clip-path="url(#${clipId})">`,
    text,
    '</g>',
  ].join('\n');
}

function dashAttr(s) {
  if (s.strokeStyle === 'dashed') return ' stroke-dasharray="8 6"';
  if (s.strokeStyle === 'dotted') return ' stroke-dasharray="2 4"';
  return '';
}

function arrowDirection(s) {
  if (s.arrowDirection) return s.arrowDirection;
  return s.type === 'line' ? 'none' : 'end';
}

function arrowheadPathSvg(s, ox, oy, atStart = false) {
  const tipX = atStart ? s.x1 : s.x2;
  const tipY = atStart ? s.y1 : s.y2;
  const tailX = atStart ? s.x2 : s.x1;
  const tailY = atStart ? s.y2 : s.y1;
  const dx = tipX - tailX;
  const dy = tipY - tailY;
  const len = Math.hypot(dx, dy);
  if (len < 1) return '';
  const ux = dx / len;
  const uy = dy / len;
  const size = 12 + (s.strokeWidth || 1) * 2;
  const angle = 0.45;
  const ax1 = tipX - size * (ux * Math.cos(angle) - uy * Math.sin(angle));
  const ay1 = tipY - size * (uy * Math.cos(angle) + ux * Math.sin(angle));
  const ax2 = tipX - size * (ux * Math.cos(-angle) - uy * Math.sin(-angle));
  const ay2 = tipY - size * (uy * Math.cos(-angle) + ux * Math.sin(-angle));
  const stroke = esc(s.strokeColor || '#1e1e1e');
  const sw = esc(s.strokeWidth || 1);
  const opacity = esc(s.opacity != null ? s.opacity : 1);
  const dash = dashAttr(s);
  const d = `M${ax1 + ox} ${ay1 + oy} L${tipX + ox} ${tipY + oy} L${ax2 + ox} ${ay2 + oy}`;
  return `<path d="${esc(d)}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"${dash}/>`;
}

function connectorSvg(s, ox, oy, base) {
  const line = `<line x1="${esc(s.x1 + ox)}" y1="${esc(s.y1 + oy)}" x2="${esc(s.x2 + ox)}" y2="${esc(s.y2 + oy)}" ${base}/>`;
  const direction = arrowDirection(s);
  return [
    line,
    (direction === 'start' || direction === 'both') ? arrowheadPathSvg(s, ox, oy, true) : '',
    (direction === 'end' || direction === 'both') ? arrowheadPathSvg(s, ox, oy, false) : '',
  ].filter(Boolean).join('\n');
}

function shapeToSvg(s, ox, oy) {
  const stroke = esc(s.strokeColor || '#1e1e1e');
  const sw = esc(s.strokeWidth || 1);
  const fill = esc(s.fillColor != null ? s.fillColor : 'none');
  const opacity = esc(s.opacity != null ? s.opacity : 1);
  const dash = dashAttr(s);
  const base = `stroke="${stroke}" stroke-width="${sw}" fill="${fill}" opacity="${opacity}"${dash}`;

  switch (s.type) {
    case 'rect':
      return [
        `<rect x="${esc(s.x + ox)}" y="${esc(s.y + oy)}" width="${esc(s.w)}" height="${esc(s.h)}" ${base}/>`,
        inlineTextSvg(s, ox, oy),
      ].filter(Boolean).join('\n');
    case 'ellipse':
      return [
        `<ellipse cx="${esc(s.x + s.w / 2 + ox)}" cy="${esc(s.y + s.h / 2 + oy)}" rx="${esc(s.w / 2)}" ry="${esc(s.h / 2)}" ${base}/>`,
        inlineTextSvg(s, ox, oy),
      ].filter(Boolean).join('\n');
    case 'diamond': {
      const cx = s.x + s.w / 2 + ox;
      const cy = s.y + s.h / 2 + oy;
      const pts = `${cx},${s.y + oy} ${s.x + s.w + ox},${cy} ${cx},${s.y + s.h + oy} ${s.x + ox},${cy}`;
      return [
        `<polygon points="${esc(pts)}" ${base}/>`,
        inlineTextSvg(s, ox, oy),
      ].filter(Boolean).join('\n');
    }
    case 'line':
    case 'arrow':
      return connectorSvg(s, ox, oy, base);
    case 'pencil': {
      if (!s.points?.length) return '';
      const d = s.points.map(([px, py], i) => `${i ? 'L' : 'M'}${px + ox} ${py + oy}`).join(' ');
      return `<path d="${esc(d)}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${dash}/>`;
    }
    case 'text': {
      return standaloneTextSvg(s, ox, oy);
    }
    default:
      return '';
  }
}

export function exportSceneToSvg(shapes, bounds) {
  const ox = -bounds.minX;
  const oy = -bounds.minY;
  const body = shapes.map((s) => shapeToSvg(s, ox, oy)).filter(Boolean).join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${esc(bounds.width)}" height="${esc(bounds.height)}" viewBox="0 0 ${esc(bounds.width)} ${esc(bounds.height)}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    body,
    '</svg>',
  ].join('\n');
}

export function downloadSvg(svg, filename = 'diagram.svg') {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
