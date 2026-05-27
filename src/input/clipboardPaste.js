import { MAX_IMAGE_BYTES } from '../core/constants.js';
import { saveHistory } from '../core/history.js';
import { uid } from '../core/math.js';
import { store, markDirty } from '../core/store.js';
import {
  copySelected,
  cutSelected,
  getPasteTargetWorld,
  pasteClipboard,
} from '../core/commands.js';
import { showError } from '../ui/toast.js';
import { setTool } from './setTool.js';

const APP_CLIPBOARD_MARKER = 'diagrammer/shapes';

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
const MAX_CANVAS_IMAGE_SIDE = 480;
const PASTE_OFFSET = 24;
let lastPasteHandledAt = 0;

function isTextEntryActive() {
  const el = document.activeElement;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

function clipboardImageFiles(dataTransfer) {
  const files = [...(dataTransfer?.files || [])].filter((file) => file.type.startsWith('image/'));
  if (files.length) return files;

  const itemFiles = [...(dataTransfer?.items || [])]
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  return itemFiles;
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

function imagePasteTarget() {
  const target = getPasteTargetWorld();
  if (target) return target;
  return { wx: 0, wy: 0 };
}

async function imageShapeFromFile(file, index, target) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only PNG, JPEG, GIF, and WebP images can be pasted.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large to paste.');
  }

  const src = await readFileAsDataUrl(file);
  const dimensions = await loadImageDimensions(src);
  const { w, h } = pastedImageSize(dimensions.width, dimensions.height);
  const offset = index * PASTE_OFFSET;

  return {
    id: uid(),
    type: 'image',
    src,
    mimeType: file.type,
    x: target.wx - w / 2 + offset,
    y: target.wy - h / 2 + offset,
    w,
    h,
    opacity: 1,
  };
}

async function pasteImageFiles(files) {
  const target = imagePasteTarget();
  const shapes = [];
  for (const file of files) {
    shapes.push(await imageShapeFromFile(file, shapes.length, target));
  }

  store.shapes.push(...shapes);
  store.selectedIds = new Set(shapes.map((shape) => shape.id));
  setTool('select');
  saveHistory();
  markDirty();
}

async function clipboardApiImageFiles() {
  if (!navigator.clipboard?.read) return [];

  const entries = await navigator.clipboard.read();
  const files = [];
  for (const entry of entries) {
    const type = entry.types.find((itemType) => ACCEPTED_IMAGE_TYPES.has(itemType));
    if (!type) continue;
    const blob = await entry.getType(type);
    files.push(new File([blob], 'pasted-image', { type }));
  }
  return files;
}

function pasteAppClipboard() {
  if (!store.clipboard?.length) return false;
  pasteClipboard();
  return true;
}

async function onPaste(e) {
  if (isTextEntryActive()) return;

  const files = clipboardImageFiles(e.clipboardData);
  if (files.length) {
    e.preventDefault();
    lastPasteHandledAt = Date.now();
    try {
      await pasteImageFiles(files);
    } catch (err) {
      showError(err.message || 'Could not paste image.');
    }
    return;
  }

  if (pasteAppClipboard()) {
    e.preventDefault();
    lastPasteHandledAt = Date.now();
  }
}

/**
 * Explicit Cmd/Ctrl+V handler. The native paste event is the primary path —
 * we wait briefly to see if it fires, then fall back to the async Clipboard
 * API for browsers that don't dispatch paste events on canvas-focused pages.
 */
export async function handlePasteShortcut() {
  if (isTextEntryActive()) return false;

  await new Promise((resolve) => setTimeout(resolve, 50));
  if (Date.now() - lastPasteHandledAt < 250) return true;

  if (navigator.clipboard?.read) {
    try {
      const files = await clipboardApiImageFiles();
      if (files.length) {
        lastPasteHandledAt = Date.now();
        await pasteImageFiles(files);
        return true;
      }
    } catch {
      // Clipboard API failed (permission, focus, unsupported MIME).
      // Fall through silently so the internal app clipboard still works.
    }
  }

  if (pasteAppClipboard()) {
    lastPasteHandledAt = Date.now();
    return true;
  }

  return false;
}

function writeAppClipboardMarker(e) {
  try {
    e.clipboardData.setData('text/plain', APP_CLIPBOARD_MARKER);
  } catch {
    // Some browsers may forbid writing; ignore — store.clipboard still works.
  }
}

function onCopy(e) {
  if (isTextEntryActive()) return;
  if (!store.selectedIds.size) return;

  copySelected();
  e.preventDefault();
  writeAppClipboardMarker(e);
}

function onCut(e) {
  if (isTextEntryActive()) return;
  if (!store.selectedIds.size) return;

  cutSelected();
  e.preventDefault();
  writeAppClipboardMarker(e);
}

export function initClipboardPaste() {
  document.addEventListener('paste', onPaste);
  document.addEventListener('copy', onCopy);
  document.addEventListener('cut', onCut);
}
