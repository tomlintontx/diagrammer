import { AUTOSAVE_KEY, MAX_AUTOSAVE_BYTES } from '../core/constants.js';
import { store } from '../core/store.js';
import { serializeScene } from './format.js';
import { showWarning } from '../ui/toast.js';

let autosaveTimer = null;
let lastAutosaveError = null;

export function getLastAutosaveError() {
  return lastAutosaveError;
}

export function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try {
      const scene = serializeScene({
        shapes: store.shapes,
        viewport: store.vp,
        styleDefaults: store.styleDefaults,
        documentTitle: store.documentTitle,
        backgroundColor: store.backgroundColor,
      });
      const payload = JSON.stringify(scene);
      if (payload.length > MAX_AUTOSAVE_BYTES) {
        throw new Error('Diagram is too large to autosave locally');
      }
      localStorage.setItem(AUTOSAVE_KEY, payload);
      lastAutosaveError = null;
    } catch (err) {
      lastAutosaveError = err;
      console.warn('Autosave failed', err);
      showWarning('Autosave failed. Save your work to a file.');
    }
  }, 500);
}
