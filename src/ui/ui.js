import rough from 'roughjs/bundled/rough.esm.js';
import { store, markDirty } from '../core/store.js';
import { undo, redo, saveHistory } from '../core/history.js';
import { MAX_IMPORT_BYTES } from '../core/constants.js';
import { NUDGE_LARGE, NUDGE_SMALL } from '../core/constants.js';
import {
  duplicateSelected,
  deleteSelected,
  copySelected,
  pasteClipboard,
  cutSelected,
  nudgeSelection,
} from '../core/commands.js';
import { exportSceneToSvg, downloadSvg } from '../scene/exportSvg.js';
import { initHelpModal } from './help.js';
import { initSaveDialog, openSaveDialog } from './saveDialog.js';
import { sceneBounds } from '../core/geometry.js';
import { sl2wl } from '../core/viewport.js';
import { initStylePanel, updateStylePanelFromSelection } from './stylePanel.js';
import { initContextMenu, hideContextMenu } from './contextMenu.js';
import { initTools, setTool, zoomIn, zoomOut, zoomReset } from '../input/tools.js';
import { rafLoop } from '../render/renderLoop.js';
import { renderSceneToCanvas } from '../render/renderScene.js';
import { serializeScene, parseSceneJson, downloadSceneJson } from '../scene/format.js';
import {
  scheduleAutosave,
  loadAutosave,
  applyScene,
  showAutosaveRecoveryBanner,
} from '../scene/persistence.js';
import { showError } from './toast.js';
import { startTextEditInline, supportsInlineText } from './textEditor.js';

const TOOL_SHORTCUT_KEYS = new Set([
  'v',
  'V',
  'r',
  'R',
  'e',
  'E',
  'd',
  'D',
  'a',
  'A',
  'l',
  'L',
  'p',
  'P',
  't',
  'T',
  'x',
  'X',
]);

function initToolbar() {
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });
}

function initZoomIndicator() {
  const el = document.getElementById('zoom-indicator');
  if (el) {
    el.addEventListener('click', zoomReset);
    el.title = 'Click to reset zoom';
  }
}

function initUndoRedo() {
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
}

function initKeyboard() {
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

function onKeyDown(e) {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (e.code === 'Space' && !store.spaceDown) {
    store.spaceDown = true;
    store.canvas.style.cursor = 'grab';
    e.preventDefault();
    return;
  }

  const ctrl = e.metaKey || e.ctrlKey;

  if (ctrl) {
    switch (e.key.toLowerCase()) {
      case 'z':
        if (e.shiftKey) redo();
        else undo();
        e.preventDefault();
        return;
      case 'y':
        redo();
        e.preventDefault();
        return;
      case 'a':
        store.shapes.forEach((s) => store.selectedIds.add(s.id));
        markDirty();
        e.preventDefault();
        return;
      case 'd':
        duplicateSelected();
        scheduleAutosave();
        e.preventDefault();
        return;
      case 'c':
        copySelected();
        e.preventDefault();
        return;
      case 'v':
        pasteClipboard();
        scheduleAutosave();
        e.preventDefault();
        return;
      case 'x':
        cutSelected();
        scheduleAutosave();
        e.preventDefault();
        return;
      case 's':
        saveSceneToFile();
        e.preventDefault();
        return;
      case '=':
      case '+':
        zoomIn();
        e.preventDefault();
        return;
      case '-':
        zoomOut();
        e.preventDefault();
        return;
      case '0':
        zoomReset();
        e.preventDefault();
        return;
      default:
        return;
    }
  }

  if (tryStartTypingOnSelection(e)) return;

  switch (e.key) {
    case 'v':
    case 'V':
      setTool('select');
      break;
    case 'r':
    case 'R':
      setTool('rect');
      break;
    case 'e':
    case 'E':
      setTool('ellipse');
      break;
    case 'd':
    case 'D':
      setTool('diamond');
      break;
    case '3':
      setTool('triangle');
      break;
    case 'a':
    case 'A':
      setTool('arrow');
      break;
    case 'l':
    case 'L':
      setTool('line');
      break;
    case 'p':
    case 'P':
      setTool('pencil');
      break;
    case 't':
    case 'T':
      setTool('text');
      break;
    case 'x':
    case 'X':
      setTool('eraser');
      break;
    case 'ArrowUp':
      nudgeSelection(0, e.shiftKey ? -sl2wl(NUDGE_LARGE) : -sl2wl(NUDGE_SMALL));
      e.preventDefault();
      break;
    case 'ArrowDown':
      nudgeSelection(0, e.shiftKey ? sl2wl(NUDGE_LARGE) : sl2wl(NUDGE_SMALL));
      e.preventDefault();
      break;
    case 'ArrowLeft':
      nudgeSelection(e.shiftKey ? -sl2wl(NUDGE_LARGE) : -sl2wl(NUDGE_SMALL), 0);
      e.preventDefault();
      break;
    case 'ArrowRight':
      nudgeSelection(e.shiftKey ? sl2wl(NUDGE_LARGE) : sl2wl(NUDGE_SMALL), 0);
      e.preventDefault();
      break;
    case 'Delete':
    case 'Backspace':
      deleteSelected();
      scheduleAutosave();
      break;
    case 'Escape':
      store.selectedIds.clear();
      store.isDrawing = false;
      store.currentShape = null;
      store.pencilPoints = [];
      store.arrowSnapPoint = null;
      hideContextMenu();
      markDirty();
      break;
    default:
      break;
  }
}

function tryStartTypingOnSelection(e) {
  if (store.editingShapeId) return false;
  if (store.currentTool !== 'select') return false;
  if (store.selectedIds.size !== 1) return false;
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  if (e.key.length !== 1 || TOOL_SHORTCUT_KEYS.has(e.key)) return false;

  const id = [...store.selectedIds][0];
  const shape = store.shapes.find((s) => s.id === id);
  if (!shape || !supportsInlineText(shape)) return false;

  startTextEditInline(id, { replaceWith: e.key });
  e.preventDefault();
  return true;
}

function onKeyUp(e) {
  if (e.code === 'Space') {
    store.spaceDown = false;
    store.canvas.style.cursor = 'default';
  }
}

function saveSceneToFile() {
  openSaveDialog((filename) => {
    store.documentTitle = filename.replace(/\.diagrammer\.json$/i, '');
    const scene = serializeScene({
      shapes: store.shapes,
      viewport: store.vp,
      styleDefaults: store.styleDefaults,
      documentTitle: store.documentTitle,
      backgroundColor: store.backgroundColor,
    });
    downloadSceneJson(scene, filename);
    scheduleAutosave();
  });
}

function downloadCanvasPng(offCanvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = offCanvas.toDataURL('image/png');
  link.click();
}

function initFileControls() {
  document.getElementById('btn-export').addEventListener('click', () => exportPNG());
  document.getElementById('btn-export-svg')?.addEventListener('click', exportSVG);
  document.getElementById('btn-export-selection')?.addEventListener('click', exportSelectionPNG);
  document.getElementById('btn-save').addEventListener('click', saveSceneToFile);

  const input = document.getElementById('file-import');
  input.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new Error('File is too large to import');
      }
      const text = await file.text();
      applyScene(parseSceneJson(text));
    } catch (err) {
      showError(`Could not open file: ${err.message}`);
    }
    input.value = '';
  });
}

function exportPNG(shapes = store.shapes, onlyIds = null, filename = 'diagram.png') {
  const list = onlyIds ? shapes.filter((s) => onlyIds.has(s.id)) : shapes;
  if (!list.length) {
    showError('Nothing to export!');
    return;
  }
  const bounds = sceneBounds(shapes, 40, onlyIds);
  const offCanvas = renderSceneToCanvas(list, bounds);
  downloadCanvasPng(offCanvas, filename);
}

function exportSelectionPNG() {
  if (!store.selectedIds.size) {
    showError('Select shapes to export.');
    return;
  }
  exportPNG(store.shapes, store.selectedIds, 'diagram-selection.png');
}

function exportSVG() {
  if (!store.shapes.length) {
    showError('Nothing to export!');
    return;
  }
  const bounds = sceneBounds(store.shapes);
  const svg = exportSceneToSvg(store.shapes, bounds);
  downloadSvg(svg);
}

export function init() {
  store.canvas = document.getElementById('canvas');
  store.ctx = store.canvas.getContext('2d');
  store.rc = rough.canvas(store.canvas);
  store.onSelectionChange = updateStylePanelFromSelection;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    store.canvas.width = w * dpr;
    store.canvas.height = h * dpr;
    store.canvas.style.width = `${w}px`;
    store.canvas.style.height = `${h}px`;
    store.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    markDirty();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  initToolbar();
  initStylePanel();
  initZoomIndicator();
  initUndoRedo();
  initKeyboard();
  initContextMenu();
  initFileControls();
  initHelpModal();
  initSaveDialog();
  initTools();

  const autosaveLoaded = loadAutosave();
  if (!autosaveLoaded) {
    saveHistory();
  } else {
    showAutosaveRecoveryBanner();
  }

  if (import.meta.env.DEV || import.meta.env.VITE_E2E === 'true') {
    window.__diagrammerShapes = () => store.shapes;
    window.__updateStylePanel = updateStylePanelFromSelection;
    window.__getCurrentTool = () => store.currentTool;
  }

  rafLoop();
}
