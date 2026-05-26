import { describe, it, expect } from 'vitest';
import { normalizeShape, validateAndNormalizeShapes } from '../../src/core/schema.js';
import { deserializeScene, parseSceneJson } from '../../src/scene/format.js';

const defaults = {
  strokeColor: '#1e1e1e',
  fillColor: '#ffffff',
  strokeWidth: 1,
  roughness: 1,
  fontSize: 24,
  fontFamily: 'Caveat',
  textAlign: 'left',
  textVerticalAlign: 'middle',
  opacity: 1,
  strokeStyle: 'solid',
  fillStyle: 'solid',
};

describe('schema security', () => {
  it('rejects invalid shape types', () => {
    expect(normalizeShape({ type: 'script' }, defaults)).toBeNull();
  });

  it('sanitizes invalid font families', () => {
    const shape = normalizeShape({ type: 'text', x: 0, y: 0, fontFamily: "'; alert(1);'" }, defaults);
    expect(shape.fontFamily).toBe('Caveat');
  });

  it('clamps opacity and truncates long text', () => {
    const shape = normalizeShape(
      { type: 'text', x: 0, y: 0, opacity: 99, text: 'x'.repeat(100_000) },
      defaults,
    );
    expect(shape.opacity).toBe(1);
    expect(shape.text.length).toBeLessThanOrEqual(64 * 1024);
  });

  it('limits pencil point count', () => {
    const points = Array.from({ length: 60_000 }, (_, i) => [i, i]);
    const shape = normalizeShape({ type: 'pencil', points }, defaults);
    expect(shape.points.length).toBeLessThanOrEqual(50_000);
  });

  it('limits imported shape count', () => {
    const shapes = Array.from({ length: 20_000 }, (_, i) => ({
      id: `s${i}`,
      type: 'rect',
      x: i,
      y: 0,
      w: 1,
      h: 1,
    }));
    expect(validateAndNormalizeShapes(shapes, defaults)).toHaveLength(10_000);
  });

  it('migrates v1 scenes to v2 defaults', () => {
    const restored = deserializeScene({
      type: 'diagrammer',
      version: 1,
      shapes: [{ id: 'a', type: 'rect', x: 0, y: 0, w: 10, h: 10 }],
    });
    expect(restored.shapes[0].strokeStyle).toBe('solid');
    expect(restored.shapes[0].fontFamily).toBe('Caveat');
    expect(restored.shapes[0].textVerticalAlign).toBe('middle');
  });

  it('throws on unsupported versions', () => {
    expect(() => deserializeScene({ type: 'diagrammer', version: 99, shapes: [] })).toThrow(/Unsupported/);
  });

  it('parseSceneJson rejects invalid json', () => {
    expect(() => parseSceneJson('{not json')).toThrow(/Invalid JSON/);
  });
});
