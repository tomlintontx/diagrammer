import { store } from '../core/store.js';
import { formatSceneFilename } from '../scene/format.js';

let modal;
let input;
let onSaveCallback = null;

function defaultBaseName() {
  const title = store.documentTitle?.trim();
  if (!title || title === 'Untitled') return 'diagram';
  return title.replace(/[/\\:*?"<>|]/g, '').trim().slice(0, 200) || 'diagram';
}

function close() {
  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
  onSaveCallback = null;
}

function submit() {
  const filename = formatSceneFilename(input.value);
  const cb = onSaveCallback;
  close();
  cb?.(filename);
}

export function openSaveDialog(onSave) {
  if (!modal || !input) {
    onSave(formatSceneFilename('diagram'));
    return;
  }

  onSaveCallback = onSave;
  input.value = defaultBaseName();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  input.focus();
  input.select();
}

export function initSaveDialog() {
  modal = document.getElementById('save-modal');
  input = document.getElementById('save-filename');
  const confirmBtn = document.getElementById('save-confirm');
  const cancelBtn = document.getElementById('save-cancel');
  if (!modal || !input) return;

  confirmBtn?.addEventListener('click', submit);
  cancelBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });
}
