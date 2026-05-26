import { SCENE_VERSION, MAX_SHAPES } from '../core/constants.js';
import { cloneShapes } from '../core/math.js';
import { validateAndNormalizeShapes } from '../core/schema.js';
import { sanitizeBackgroundColor, sanitizeStyleDefaults } from '../core/validation.js';

export const APP_VERSION = '0.2.0';

const DEFAULT_STYLE = {
  strokeColor: '#1e1e1e',
  fillColor: '#ffffff',
  strokeWidth: 1,
  roughness: 1,
  fontSize: 24,
  fontFamily: 'Caveat',
  textAlign: 'left',
  opacity: 1,
  strokeStyle: 'solid',
  fillStyle: 'solid',
};

export function serializeScene({
  shapes,
  viewport,
  styleDefaults,
  documentTitle = 'Untitled',
  backgroundColor = '#f8f9fa',
  createdAt,
}) {
  const now = new Date().toISOString();
  return {
    version: SCENE_VERSION,
    type: 'diagrammer',
    title: documentTitle,
    createdAt: createdAt || now,
    updatedAt: now,
    appVersion: APP_VERSION,
    backgroundColor,
    viewport: { ...viewport },
    styleDefaults: { ...DEFAULT_STYLE, ...styleDefaults },
    shapes: cloneShapes(shapes),
    savedAt: now,
  };
}

function migrateScene(data) {
  const version = data.version ?? 1;
  if (version < 2) {
    for (const s of data.shapes || []) {
      if (s.opacity == null) s.opacity = 1;
      if (!s.strokeStyle) s.strokeStyle = 'solid';
      if (!s.fillStyle) s.fillStyle = 'solid';
      if (!s.fontFamily) s.fontFamily = 'Caveat';
      if (!s.textAlign) s.textAlign = 'left';
    }
    data.version = 2;
  }
  return data;
}

export function deserializeScene(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid scene file');
  }
  if (data.type !== 'diagrammer') {
    throw new Error('Not a Diagrammer scene file');
  }
  const version = data.version ?? 1;
  if (version > SCENE_VERSION) {
    throw new Error(`Unsupported scene version: ${version}`);
  }

  const migrated = migrateScene({ ...data, version });
  const styleDefaults = sanitizeStyleDefaults(migrated.styleDefaults, DEFAULT_STYLE);
  const rawShapes = Array.isArray(migrated.shapes) ? migrated.shapes.slice(0, MAX_SHAPES) : [];
  const shapes = validateAndNormalizeShapes(rawShapes, styleDefaults);

  return {
    shapes,
    viewport: migrated.viewport ?? { x: 0, y: 0, zoom: 1 },
    styleDefaults,
    documentTitle: typeof migrated.title === 'string' ? migrated.title.slice(0, 256) : 'Untitled',
    backgroundColor: sanitizeBackgroundColor(migrated.backgroundColor, '#f8f9fa'),
    createdAt: migrated.createdAt,
    appVersion: migrated.appVersion,
  };
}

export function parseSceneJson(text) {
  if (typeof text !== 'string') {
    throw new Error('Invalid scene file');
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON in scene file');
  }
  return deserializeScene(data);
}

export function formatSceneFilename(name) {
  let base = String(name || '').trim();
  base = base.replace(/\.(diagrammer\.)?json$/i, '');
  base = base.replace(/[/\\:*?"<>|]/g, '').trim();
  if (!base) base = 'diagram';
  return `${base.slice(0, 200)}.diagrammer.json`;
}

export function downloadSceneJson(scene, filename = 'diagram.diagrammer.json') {
  const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = formatSceneFilename(filename);
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
