import { shapeBBox } from '../core/geometry.js';
import { store, markDirty } from '../core/store.js';
import { saveHistory } from '../core/history.js';
import { w2s } from '../core/viewport.js';
import { scheduleAutosave } from '../scene/persistence.js';
import { resetTextToolPlacement } from '../input/textPlacement.js';
import { sanitizeFontFamily } from '../core/validation.js';
import {
  fitTextToBox,
  INLINE_TEXT_PADDING_X,
  INLINE_TEXT_PADDING_Y,
  textFont,
  wrapText,
} from '../core/textLayout.js';

const TEXT_SHAPE_TYPES = new Set(['rect', 'ellipse', 'diamond', 'triangle', 'text']);

export function supportsInlineText(shape) {
  return TEXT_SHAPE_TYPES.has(shape?.type);
}

export function startTextEdit(shapeId, options = {}) {
  const s = store.shapes.find((sh) => sh.id === shapeId);
  if (!s) return;

  const replacing = options.replaceWith !== undefined;
  store.editingShapeId = shapeId;
  const wrap = document.getElementById('text-editor-wrap');
  const ta = document.getElementById('text-editor');
  const measureCtx = document.createElement('canvas').getContext('2d');
  const { sx, sy } = w2s(s.x, s.y);
  const { sx: sx2, sy: sy2 } = w2s(s.x + (s.w || 200), s.y + (s.h || 40));
  const overlayW = Math.max(60, sx2 - sx);
  const overlayH = Math.max(36, sy2 - sy);

  if (replacing) {
    s.text = options.replaceWith;
    markDirty();
  }
  ta.value = replacing ? options.replaceWith : s.text || '';
  const fontSize = (s.fontSize || 24) * store.vp.zoom;
  ta.style.fontSize = `${fontSize}px`;
  ta.style.fontFamily = `'${sanitizeFontFamily(s.fontFamily, 'Caveat')}', cursive`;
  ta.style.textAlign = s.textAlign || 'left';
  ta.style.color = s.strokeColor || '#1e1e1e';
  ta.style.width = `${overlayW}px`;
  ta.style.height = `${overlayH}px`;
  ta.style.minWidth = '60px';
  ta.style.minHeight = '36px';
  ta.style.resize = 'none';
  ta.style.overflow = 'hidden';
  ta.style.whiteSpace = 'pre-wrap';
  ta.style.overflowWrap = 'break-word';

  function applyStandalonePadding() {
    const padX = Math.min(INLINE_TEXT_PADDING_X * store.vp.zoom, Math.max(4, overlayW / 8));
    const padY = Math.min(INLINE_TEXT_PADDING_Y * store.vp.zoom, Math.max(4, overlayH / 8));
    const lineHeight = fontSize * 1.35;
    const lines = wrapText(
      measureCtx,
      ta.value || ' ',
      Math.max(10, overlayW - padX * 2),
      textFont(s, fontSize),
    );
    const totalHeight = lines.length * lineHeight;
    const remainingY = Math.max(0, overlayH - totalHeight);
    let verticalPad = Math.max(padY, remainingY / 2);
    if (s.textVerticalAlign === 'top') verticalPad = padY;
    if (s.textVerticalAlign === 'bottom') verticalPad = Math.max(padY, overlayH - totalHeight - padY);
    ta.style.lineHeight = `${lineHeight}px`;
    ta.style.padding = `${verticalPad}px ${padX}px`;
  }

  wrap.style.left = `${sx}px`;
  wrap.style.top = `${sy}px`;
  wrap.classList.add('is-open');
  ta.style.display = 'block';
  ta.focus();
  if (replacing) {
    ta.setSelectionRange(ta.value.length, ta.value.length);
  } else {
    ta.select();
  }

  function resetStandaloneStyles() {
    ta.style.width = '';
    ta.style.height = '';
    ta.style.minWidth = '';
    ta.style.minHeight = '';
    ta.style.resize = '';
    ta.style.overflow = '';
    ta.style.whiteSpace = '';
    ta.style.overflowWrap = '';
    ta.style.lineHeight = '';
    ta.style.padding = '';
  }

  function updateStandaloneText() {
    applyStandalonePadding();
  }

  ta.addEventListener('input', updateStandaloneText);
  applyStandalonePadding();

  function commit() {
    const text = ta.value;
    const sh = store.shapes.find((item) => item.id === store.editingShapeId);
    if (sh) {
      sh.text = text;
      if (!text.trim()) {
        store.shapes = store.shapes.filter((item) => item.id !== store.editingShapeId);
      }
      saveHistory();
      scheduleAutosave();
      markDirty();
    }
    resetStandaloneStyles();
    wrap.classList.remove('is-open');
    ta.style.display = 'none';
    ta.removeEventListener('input', updateStandaloneText);
    store.editingShapeId = null;
    resetTextToolPlacement();
    store.canvas.focus();
  }

  ta.addEventListener('keydown', function onKey(ev) {
    if (ev.key === 'Escape') {
      const sh = store.shapes.find((item) => item.id === store.editingShapeId);
      if (sh && !sh.text.trim()) {
        store.shapes = store.shapes.filter((item) => item.id !== store.editingShapeId);
        saveHistory();
        scheduleAutosave();
        markDirty();
      }
      resetStandaloneStyles();
      wrap.classList.remove('is-open');
      ta.style.display = 'none';
      ta.removeEventListener('input', updateStandaloneText);
      ta.removeEventListener('keydown', onKey);
      store.editingShapeId = null;
      resetTextToolPlacement();
      store.canvas.focus();
      ev.preventDefault();
    }
  });

  ta.addEventListener(
    'blur',
    function onBlur() {
      commit();
      ta.removeEventListener('blur', onBlur);
    },
    { once: true },
  );
}

export function startTextEditInline(shapeId, options = {}) {
  const s = store.shapes.find((sh) => sh.id === shapeId);
  if (!s || !supportsInlineText(s)) return;

  const replacing = options.replaceWith !== undefined;

  const existingWrap = document.getElementById('text-editor-wrap');
  if (existingWrap.classList.contains('is-open')) {
    existingWrap.classList.remove('is-open');
  }

  if (s.type === 'text') {
    startTextEdit(shapeId, options);
    return;
  }

  store.editingShapeId = shapeId;
  const originalText = s.text || '';
  const bb = shapeBBox(s);
  const { sx: bx1, sy: by1 } = w2s(bb.x, bb.y);
  const { sx: bx2, sy: by2 } = w2s(bb.x + bb.w, bb.y + bb.h);
  const overlayW = Math.max(60, bx2 - bx1);
  const overlayH = Math.max(36, by2 - by1);

  const wrap = document.getElementById('text-editor-wrap');
  const ta = document.getElementById('text-editor');
  const measureCtx = document.createElement('canvas').getContext('2d');

  if (replacing) {
    s.text = options.replaceWith;
    markDirty();
  }
  ta.value = replacing ? options.replaceWith : s.text || '';
  ta.style.fontFamily = `'${sanitizeFontFamily(s.fontFamily, 'Caveat')}', cursive`;
  ta.style.textAlign = s.textAlign || 'center';
  ta.style.color = s.strokeColor || '#1e1e1e';
  ta.style.background = s.fillColor || 'transparent';
  ta.style.border = '1.5px dashed #1a73e8';
  ta.style.borderRadius = '4px';
  ta.style.boxSizing = 'border-box';
  ta.style.resize = 'none';
  ta.style.overflow = 'hidden';
  ta.style.whiteSpace = 'pre-wrap';
  ta.style.overflowWrap = 'break-word';
  ta.style.width = `${overlayW}px`;
  ta.style.height = `${overlayH}px`;

  wrap.style.left = `${bx1}px`;
  wrap.style.top = `${by1}px`;
  wrap.classList.add('is-open');
  ta.style.display = 'block';

  function applyInlineFit() {
    const padX = Math.min(INLINE_TEXT_PADDING_X * store.vp.zoom, Math.max(4, overlayW / 8));
    const padY = Math.min(INLINE_TEXT_PADDING_Y * store.vp.zoom, Math.max(4, overlayH / 8));
    const fitShape = {
      ...s,
      fontSize: (s.fontSize || 18) * store.vp.zoom,
    };
    const fit = fitTextToBox(
      measureCtx,
      fitShape,
      ta.value || ' ',
      Math.max(10, overlayW - padX * 2),
      Math.max(10, overlayH - padY * 2),
    );
    const remainingY = Math.max(0, overlayH - fit.totalHeight);
    let verticalPad = Math.max(padY, remainingY / 2);
    if (s.textVerticalAlign === 'top') verticalPad = padY;
    if (s.textVerticalAlign === 'bottom') verticalPad = Math.max(padY, overlayH - fit.totalHeight - padY);
    ta.style.fontSize = `${fit.fontSize}px`;
    ta.style.lineHeight = `${fit.lineHeight}px`;
    ta.style.padding = `${verticalPad}px ${padX}px`;
  }

  if (replacing) {
    applyInlineFit();
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  } else {
    requestAnimationFrame(() => {
      applyInlineFit();
      ta.focus();
      ta.select();
    });
  }

  function updateLiveText() {
    const sh = store.shapes.find((item) => item.id === store.editingShapeId);
    if (sh) {
      sh.text = ta.value;
      markDirty();
    }
    applyInlineFit();
  }
  ta.addEventListener('input', updateLiveText);

  function resetTaStyles() {
    ta.style.textAlign = '';
    ta.style.background = '';
    ta.style.border = '';
    ta.style.borderRadius = '';
    ta.style.padding = '';
    ta.style.boxSizing = '';
    ta.style.resize = '';
    ta.style.overflow = '';
    ta.style.whiteSpace = '';
    ta.style.overflowWrap = '';
    ta.style.width = '';
    ta.style.height = '';
    ta.style.lineHeight = '';
  }

  function commitInline() {
    const sh = store.shapes.find((item) => item.id === store.editingShapeId);
    if (sh) {
      sh.text = ta.value;
      saveHistory();
      scheduleAutosave();
      markDirty();
    }
    resetTaStyles();
    wrap.classList.remove('is-open');
    ta.style.display = 'none';
    ta.removeEventListener('input', updateLiveText);
    ta.removeEventListener('keydown', onKey);
    store.editingShapeId = null;
    resetTextToolPlacement();
    store.canvas.focus();
  }

  function onKey(ev) {
    if (ev.key === 'Escape') {
      const sh = store.shapes.find((item) => item.id === store.editingShapeId);
      if (sh) {
        sh.text = originalText;
        markDirty();
      }
      resetTaStyles();
      wrap.classList.remove('is-open');
      ta.style.display = 'none';
      ta.removeEventListener('input', updateLiveText);
      ta.removeEventListener('keydown', onKey);
      store.editingShapeId = null;
      resetTextToolPlacement();
      store.canvas.focus();
      ev.preventDefault();
    }
  }
  ta.addEventListener('keydown', onKey);

  ta.addEventListener(
    'blur',
    function onBlur() {
      commitInline();
      ta.removeEventListener('blur', onBlur);
    },
    { once: true },
  );
}
