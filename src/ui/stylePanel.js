import { STROKE_COLORS, FILL_COLORS } from '../core/constants.js';
import { store } from '../core/store.js';
import { applyStyleToSelection } from '../core/commands.js';
import { saveHistory } from '../core/history.js';

const FILLABLE_TYPES = new Set(['rect', 'ellipse', 'diamond', 'triangle']);
const CONNECTOR_TYPES = new Set(['arrow', 'line']);
const TEXT_CAPABLE_TYPES = new Set(['rect', 'ellipse', 'diamond', 'triangle', 'text']);

function selectedShapes() {
  return store.shapes.filter((shape) => store.selectedIds.has(shape.id));
}

function allSelectedMatch(shapes, predicate) {
  return shapes.length > 0 && shapes.every(predicate);
}

function setSectionVisible(controlId, visible) {
  const section = document.getElementById(controlId)?.closest('.panel-section');
  section?.classList.toggle('is-hidden', !visible);
}

function updateVisibleSections(shapes) {
  const hasSelection = shapes.length > 0;
  const canFill = allSelectedMatch(shapes, (shape) => FILLABLE_TYPES.has(shape.type));
  const canUseArrowheads = allSelectedMatch(shapes, (shape) => CONNECTOR_TYPES.has(shape.type));
  const canEditText = allSelectedMatch(shapes, (shape) => TEXT_CAPABLE_TYPES.has(shape.type));

  setSectionVisible('fill-swatches', !hasSelection || canFill);
  setSectionVisible('fill-style-select', !hasSelection || canFill);
  setSectionVisible('arrow-direction-select', canUseArrowheads);
  setSectionVisible('font-size-input', !hasSelection || canEditText);
  setSectionVisible('font-family-select', !hasSelection || canEditText);
  setSectionVisible('text-align-btns', !hasSelection || canEditText);
  setSectionVisible('text-vertical-align-btns', !hasSelection || canEditText);
}

export function initStylePanel() {
  const strokeRow = document.getElementById('stroke-swatches');
  STROKE_COLORS.forEach((color) => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = color;
    sw.dataset.color = color;
    if (color === store.styleDefaults.strokeColor) sw.classList.add('active');
    sw.addEventListener('click', () => {
      strokeRow.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
      sw.classList.add('active');
      applyStyleToSelection('strokeColor', color);
    });
    strokeRow.appendChild(sw);
  });

  const fillRow = document.getElementById('fill-swatches');
  FILL_COLORS.forEach((color) => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    if (color === null) {
      sw.classList.add('none-swatch');
      sw.title = 'No fill';
    } else {
      sw.style.background = color;
      if (color === '#ffffff') sw.classList.add('white-swatch');
    }
    sw.dataset.color = color === null ? 'null' : color;
    if (color === store.styleDefaults.fillColor) sw.classList.add('active');
    sw.addEventListener('click', () => {
      fillRow.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
      sw.classList.add('active');
      applyStyleToSelection('fillColor', color);
    });
    fillRow.appendChild(sw);
  });

  document.querySelectorAll('.stroke-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stroke-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyStyleToSelection('strokeWidth', Number(btn.dataset.width));
    });
  });

  const slider = document.getElementById('roughness-slider');
  const valEl = document.getElementById('roughness-val');
  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    valEl.textContent = v;
    applyStyleToSelection('roughness', v, false);
  });
  slider.addEventListener('change', () => saveHistory());

  const opacitySlider = document.getElementById('opacity-slider');
  const opacityVal = document.getElementById('opacity-val');
  opacitySlider?.addEventListener('input', () => {
    const v = parseFloat(opacitySlider.value);
    opacityVal.textContent = Math.round(v * 100);
    applyStyleToSelection('opacity', v, false);
  });
  opacitySlider?.addEventListener('change', () => saveHistory());

  document.getElementById('stroke-style-select')?.addEventListener('change', (e) => {
    applyStyleToSelection('strokeStyle', e.target.value);
  });
  document.getElementById('arrow-direction-select')?.addEventListener('change', (e) => {
    applyStyleToSelection('arrowDirection', e.target.value);
  });
  document.getElementById('fill-style-select')?.addEventListener('change', (e) => {
    applyStyleToSelection('fillStyle', e.target.value);
  });
  document.getElementById('font-size-input')?.addEventListener('change', (e) => {
    applyStyleToSelection('fontSize', Number(e.target.value) || 24);
  });
  document.getElementById('font-family-select')?.addEventListener('change', (e) => {
    applyStyleToSelection('fontFamily', e.target.value);
  });
  document.querySelectorAll('[data-text-align]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-text-align]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyStyleToSelection('textAlign', btn.dataset.textAlign);
    });
  });
  document.querySelectorAll('[data-text-vertical-align]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-text-vertical-align]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyStyleToSelection('textVerticalAlign', btn.dataset.textVerticalAlign);
    });
  });
}

export function updateStylePanelFromSelection() {
  const shapes = selectedShapes();
  updateVisibleSections(shapes);
  if (shapes.length === 0) return;

  const s = shapes[0];
  if (!s) return;

  document.querySelectorAll('#stroke-swatches .swatch').forEach((sw) => {
    sw.classList.toggle('active', sw.dataset.color === s.strokeColor);
  });

  document.querySelectorAll('#fill-swatches .swatch').forEach((sw) => {
    const swVal = sw.dataset.color === 'null' ? null : sw.dataset.color;
    sw.classList.toggle('active', swVal === s.fillColor);
  });

  document.querySelectorAll('.stroke-btn').forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.width) === s.strokeWidth);
  });

  const slider = document.getElementById('roughness-slider');
  const valEl = document.getElementById('roughness-val');
  if (slider && s.roughness != null) {
    slider.value = s.roughness;
    valEl.textContent = s.roughness;
  }

  const opacitySlider = document.getElementById('opacity-slider');
  const opacityVal = document.getElementById('opacity-val');
  if (opacitySlider && s.opacity != null) {
    opacitySlider.value = s.opacity;
    opacityVal.textContent = Math.round(s.opacity * 100);
  }

  const strokeStyle = document.getElementById('stroke-style-select');
  if (strokeStyle && s.strokeStyle) strokeStyle.value = s.strokeStyle;
  const arrowDirection = document.getElementById('arrow-direction-select');
  if (arrowDirection) {
    arrowDirection.value = s.arrowDirection || (s.type === 'line' ? 'none' : 'end');
  }
  const fillStyle = document.getElementById('fill-style-select');
  if (fillStyle && s.fillStyle) fillStyle.value = s.fillStyle;
  const fontSize = document.getElementById('font-size-input');
  if (fontSize && s.fontSize) fontSize.value = s.fontSize;
  const fontFamily = document.getElementById('font-family-select');
  if (fontFamily && s.fontFamily) fontFamily.value = s.fontFamily;
  document.querySelectorAll('[data-text-align]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.textAlign === (s.textAlign || 'center'));
  });
  document.querySelectorAll('[data-text-vertical-align]').forEach((btn) => {
    btn.classList.toggle(
      'active',
      btn.dataset.textVerticalAlign === (s.textVerticalAlign || 'middle'),
    );
  });
}
