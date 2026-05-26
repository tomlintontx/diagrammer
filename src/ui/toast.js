let toastEl = null;
let hideTimer = null;

function ensureToastEl() {
  if (toastEl) return toastEl;
  toastEl = document.createElement('div');
  toastEl.id = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  return toastEl;
}

export function showToast(message, tone = 'info', durationMs = 4000) {
  const el = ensureToastEl();
  el.textContent = message;
  el.dataset.tone = tone;
  el.classList.add('is-visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    el.classList.remove('is-visible');
  }, durationMs);
}

export function showError(message) {
  showToast(message, 'error', 6000);
}

export function showWarning(message) {
  showToast(message, 'warning', 6000);
}
