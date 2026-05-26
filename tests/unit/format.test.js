import { describe, it, expect } from 'vitest';
import { serializeScene, deserializeScene, formatSceneFilename } from '../../src/scene/format.js';

describe('scene format', () => {
  it('round-trips shapes and viewport', () => {
    const original = {
      shapes: [{ id: 'a', type: 'rect', x: 1, y: 2, w: 3, h: 4 }],
      viewport: { x: 10, y: 20, zoom: 1.5 },
      styleDefaults: {
        strokeColor: '#1e1e1e',
        fillColor: '#fff',
        strokeWidth: 2,
        roughness: 1,
        fontSize: 24,
      },
    };
    const serialized = serializeScene(original);
    const restored = deserializeScene(serialized);
    expect(restored.shapes[0].type).toBe('rect');
    expect(restored.shapes[0].w).toBe(3);
    expect(restored.viewport).toEqual(original.viewport);
    expect(restored.styleDefaults.strokeWidth).toBe(2);
    expect(restored.styleDefaults.fontFamily).toBe('Caveat');
    expect(restored.styleDefaults.textAlign).toBe('center');
    expect(restored.styleDefaults.textVerticalAlign).toBe('middle');
  });

  it('rejects invalid files', () => {
    expect(() => deserializeScene({ type: 'other' })).toThrow(/Not a Diagrammer/);
  });

  it('formats scene filenames', () => {
    expect(formatSceneFilename('My Flow')).toBe('My Flow.diagrammer.json');
    expect(formatSceneFilename('bad/name')).toBe('badname.diagrammer.json');
    expect(formatSceneFilename('already.diagrammer.json')).toBe('already.diagrammer.json');
    expect(formatSceneFilename('')).toBe('diagram.diagrammer.json');
  });
});
