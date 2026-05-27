import { MAX_IMAGE_BYTES } from '../core/constants.js';
import { saveHistory } from '../core/history.js';
import { uid } from '../core/math.js';
import { store, markDirty } from '../core/store.js';
import { s2w } from '../core/viewport.js';
import { pasteClipboard } from '../core/commands.js';
import { showError } from '../ui/toast.js';
import { setTool } from './setTool.js';

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
const MAX_CANVAS_IMAGE_SIDE = 480;
const PASTE_OFFSET = 24;

function isTextEntryActive() {
  const el = document.activeElement;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

function clipboardImageFiles(dataTransfer) {
  const items = [...(dataTransfer?.items || [])];
  return items
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter(Boolean);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({
      width: img.naturalWidth || img.width || 240,
      height: img.naturalHeight || img.height || 180,
    });
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

function pastedImageSize(width, height) {
  const scale = Math.min(1, MAX_CANVAS_IMAGE_SIDE / Math.max(width, height));
  return {
    w: Math.max(10, Math.round(width * scale)),
    h: Math.max(10, Math.round(height * scale)),
  };
}

function viewportCenter() {
  const canvasWidth = store.canvas?.clientWidth || window.innerWidth || 800;
  const canvasHeight = store.canvas?.clientHeight || window.innerHeight || 600;
  return s2w(canvasWidth / 2, canvasHeight / 2);
}

async function imageShapeFromFile(file, index) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only PNG, JPEG, GIF, and WebP images can be pasted.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large to paste.');
  }

  const src = await readFileAsDataUrl(file);
  const dimensions = await loadImageDimensions(src);
  const { w, h } = pastedImageSize(dimensions.width, dimensions.height);
  const { wx, wy } = viewportCenter();
  const offset = index * PASTE_OFFSET;

  return {
    id: uid(),
    type: 'image',
    src,
    mimeType: file.type,
    x: wx - w / 2 + offset,
    y: wy - h / 2 + offset,
    w,
    h,
    opacity: 1,
  };
}

async function pasteImageFiles(files) {
  const shapes = [];
  for (const file of files) {
    shapes.push(await imageShapeFromFile(file, shapes.length));
  }

  store.shapes.push(...shapes);
  store.selectedIds = new Set(shapes.map((shape) => shape.id));
  setTool('select');
  saveHistory();
  markDirty();
}

async function onPaste(e) {
  if (isTextEntryActive()) return;

  const files = clipboardImageFiles(e.clipboardData);
  if (files.length) {
    e.preventDefault();
    try {
      await pasteImageFiles(files);
    } catch (err) {
      showError(err.message || 'Could not paste image.');
    }
    return;
  }

  if (store.clipboard?.length) {
    e.preventDefault();
    pasteClipboard();
  }
}

export function initClipboardPaste() {
  document.addEventListener('paste', onPaste);
}
