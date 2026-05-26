import { MAX_HISTORY } from './constants.js';
import { cloneShapes } from './math.js';
import { store, markDirty } from './store.js';
import { scheduleAutosave } from '../scene/autosave.js';

export function saveHistory() {
  store.history = store.history.slice(0, store.historyIndex + 1);
  store.history.push(cloneShapes(store.shapes));
  if (store.history.length > MAX_HISTORY) store.history.shift();
  store.historyIndex = store.history.length - 1;
  updateUndoRedoBtns();
  scheduleAutosave();
}

function restoreSelection(prevIds) {
  const valid = new Set(store.shapes.map((s) => s.id));
  store.selectedIds = new Set([...prevIds].filter((id) => valid.has(id)));
}

export function undo() {
  if (store.historyIndex <= 0) return;
  const prevSelection = [...store.selectedIds];
  store.historyIndex--;
  store.shapes = cloneShapes(store.history[store.historyIndex]);
  restoreSelection(prevSelection);
  markDirty();
  updateUndoRedoBtns();
}

export function redo() {
  if (store.historyIndex >= store.history.length - 1) return;
  const prevSelection = [...store.selectedIds];
  store.historyIndex++;
  store.shapes = cloneShapes(store.history[store.historyIndex]);
  restoreSelection(prevSelection);
  markDirty();
  updateUndoRedoBtns();
}

export function updateUndoRedoBtns() {
  if (typeof document === 'undefined') return;
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = store.historyIndex <= 0;
  if (btnRedo) btnRedo.disabled = store.historyIndex >= store.history.length - 1;
}
