import { store } from '../core/store.js';
import { resetTextToolPlacement } from './textPlacement.js';

export function setTool(name) {
  store.currentTool = name;

  document.querySelectorAll('.tool-btn').forEach((btn) => {
    const active = btn.dataset.tool === name;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  store.isDrawing = false;
  store.currentShape = null;
  store.pencilPoints = [];
  store.arrowSnapPoint = null;
  store.isRubberBand = false;
  store.rubberBand = null;
  resetTextToolPlacement();

  const cursors = { select: 'default', text: 'text', eraser: 'cell' };
  store.canvas.style.cursor = cursors[name] || 'crosshair';
}

export function returnToSelectAfterShape() {
  setTool('select');
}
