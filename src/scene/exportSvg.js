import {
  fitTextToBox,
  INLINE_TEXT_PADDING_X,
  INLINE_TEXT_PADDING_Y,
} from '../core/textLayout.js';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function inlineTextX(s, padX, ox) {
  const align = s.textAlign || 'center';
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

function dashAttr(s) {
  if (s.strokeStyle === 'dashed') return ' stroke-dasharray="8 6"';
  if (s.strokeStyle === 'dotted') return ' stroke-dasharray="2 4"';
  return '';
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
      return `<line x1="${esc(s.x1 + ox)}" y1="${esc(s.y1 + oy)}" x2="${esc(s.x2 + ox)}" y2="${esc(s.y2 + oy)}" ${base}/>`;
    case 'pencil': {
      if (!s.points?.length) return '';
      const d = s.points.map(([px, py], i) => `${i ? 'L' : 'M'}${px + ox} ${py + oy}`).join(' ');
      return `<path d="${esc(d)}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${dash}/>`;
    }
    case 'text': {
      const fs = esc(s.fontSize || 24);
      const ff = esc(s.fontFamily || 'Caveat');
      const lines = (s.text || '').split('\n');
      const anchor = svgTextAnchor(s.textAlign || 'left');
      return lines
        .map(
          (line, i) =>
            `<text x="${esc(s.x + ox)}" y="${esc(s.y + oy + (s.fontSize || 24) * (i + 1))}" font-size="${fs}" font-family="${ff}" fill="${stroke}" opacity="${opacity}" text-anchor="${anchor}">${esc(line)}</text>`,
        )
        .join('\n');
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
