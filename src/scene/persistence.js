import { AUTOSAVE_KEY } from '../core/constants.js';
import { parseSceneJson } from './format.js';
import { store, markDirty } from '../core/store.js';
import { saveHistory } from '../core/history.js';
import { scheduleAutosave, getLastAutosaveError } from './autosave.js';
import { showWarning } from '../ui/toast.js';

export { scheduleAutosave } from './autosave.js';

export function loadAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return false;
    applyScene(parseSceneJson(raw));
    return true;
  } catch (err) {
    console.warn('Failed to load autosave', err);
    showWarning('Could not restore autosaved diagram.');
    return false;
  }
}

export function applyScene({ shapes, viewport, styleDefaults, documentTitle, backgroundColor }) {
  store.shapes = shapes;
  store.vp.x = viewport.x ?? 0;
  store.vp.y = viewport.y ?? 0;
  store.vp.zoom = viewport.zoom ?? 1;
  Object.assign(store.styleDefaults, styleDefaults);
  if (documentTitle) store.documentTitle = documentTitle;
  if (backgroundColor) store.backgroundColor = backgroundColor;
  store.selectedIds.clear();
  store.history = [];
  store.historyIndex = -1;
  saveHistory();
  markDirty();
  scheduleAutosave();
}

export function clearAutosave() {
  localStorage.removeItem(AUTOSAVE_KEY);
}

export function showAutosaveRecoveryBanner() {
  let banner = document.getElementById('autosave-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'autosave-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `
      <span>Restored your last autosaved diagram.</span>
      <button type="button" id="autosave-discard">Discard</button>
    `;
    document.body.appendChild(banner);
    banner.querySelector('#autosave-discard').addEventListener('click', () => {
      clearAutosave();
      banner.remove();
    });
  }

  if (getLastAutosaveError()) {
    showWarning('Autosave may be out of date. Save your work to a file.');
  }
}
