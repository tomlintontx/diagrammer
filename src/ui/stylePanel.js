import { STROKE_COLORS, FILL_COLORS } from '../core/constants.js';
import { store } from '../core/store.js';
import { applyStyleToSelection } from '../core/commands.js';
import { saveHistory } from '../core/history.js';

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
  if (store.selectedIds.size === 0) return;
  const id = [...store.selectedIds][0];
  const s = store.shapes.find((sh) => sh.id === id);
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
