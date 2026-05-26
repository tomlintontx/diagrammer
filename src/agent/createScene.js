import { serializeScene, deserializeScene, parseSceneJson } from '../scene/format.js';

export { parseSceneJson, deserializeScene, serializeScene };

/**
 * Build a Diagrammer v2 scene file from high-level inputs.
 */
export function createScene({
  shapes,
  viewport = { x: 0, y: 0, zoom: 1 },
  styleDefaults = {},
  documentTitle = 'Untitled',
  backgroundColor = '#f8f9fa',
  createdAt,
}) {
  return serializeScene({
    shapes,
    viewport,
    styleDefaults,
    documentTitle,
    backgroundColor,
    createdAt,
  });
}

/**
 * Validate scene or raw JSON text. Returns normalized scene data on success.
 */
export function validateScene(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  const restored = deserializeScene(data);
  return {
    valid: true,
    scene: createScene({
      shapes: restored.shapes,
      viewport: restored.viewport,
      styleDefaults: restored.styleDefaults,
      documentTitle: restored.documentTitle,
      backgroundColor: restored.backgroundColor,
      createdAt: restored.createdAt,
    }),
    restored,
  };
}

/**
 * Validate scene JSON text and return a result object instead of throwing.
 */
export function tryValidateScene(input) {
  try {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    if (typeof input === 'string') {
      const restored = parseSceneJson(text);
      return {
        valid: true,
        scene: createScene({
          shapes: restored.shapes,
          viewport: restored.viewport,
          styleDefaults: restored.styleDefaults,
          documentTitle: restored.documentTitle,
          backgroundColor: restored.backgroundColor,
          createdAt: restored.createdAt,
        }),
        restored,
      };
    }
    return validateScene(input);
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Normalize an existing scene file to canonical Diagrammer v2 output.
 */
export function normalizeScene(input) {
  const result = typeof input === 'string'
    ? tryValidateScene(input)
    : tryValidateScene(JSON.stringify(input));

  if (!result.valid) {
    throw new Error(result.error);
  }
  return result.scene;
}
