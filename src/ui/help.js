const SHORTCUTS = [
  ['V', 'Select'],
  ['R', 'Rectangle'],
  ['E', 'Ellipse'],
  ['D', 'Diamond'],
  ['A', 'Arrow'],
  ['L', 'Line'],
  ['P', 'Pencil'],
  ['T', 'Text'],
  ['X', 'Eraser'],
  ['Delete', 'Delete selection'],
  ['Arrow keys', 'Nudge 1px'],
  ['Shift + arrows', 'Nudge 10px'],
  ['Ctrl/Cmd+Z', 'Undo'],
  ['Ctrl/Cmd+Shift+Z', 'Redo'],
  ['Ctrl/Cmd+C/V/X', 'Copy / Paste / Cut'],
  ['Ctrl/Cmd+D', 'Duplicate'],
  ['Alt + drag', 'Duplicate while dragging'],
  ['Ctrl/Cmd+S', 'Save JSON'],
  ['?', 'This help'],
];

export function initHelpModal() {
  const modal = document.getElementById('help-modal');
  const list = document.getElementById('help-shortcuts');
  const closeBtn = document.getElementById('help-close');
  const btnHelp = document.getElementById('btn-help');
  if (!modal || !list) return;

  list.innerHTML = SHORTCUTS.map(
    ([key, desc]) => `<li><kbd>${key}</kbd><span>${desc}</span></li>`,
  ).join('');

  function open() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  btnHelp?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      modal.classList.contains('is-open') ? close() : open();
    }
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}
