import { describe, it, expect } from 'vitest';
import { createScene, tryValidateScene, normalizeScene } from '../../src/agent/createScene.js';
import { fromSpec } from '../../src/agent/fromSpec.js';
import { rect, arrow } from '../../src/agent/shapes.js';
import { deserializeScene } from '../../src/scene/format.js';

describe('agent createScene', () => {
  it('creates a valid Diagrammer v2 scene', () => {
    const scene = createScene({
      documentTitle: 'Test',
      shapes: [rect({ id: 'a', x: 10, y: 20, w: 100, h: 50, text: 'Box' })],
    });
    expect(scene.type).toBe('diagrammer');
    expect(scene.version).toBe(2);
    expect(scene.shapes).toHaveLength(1);
    expect(scene.shapes[0].type).toBe('rect');
  });

  it('validates scene files', () => {
    const scene = createScene({ shapes: [rect({ x: 0, y: 0, w: 50, h: 50 })] });
    const result = tryValidateScene(JSON.stringify(scene));
    expect(result.valid).toBe(true);
    expect(result.scene.shapes).toHaveLength(1);
  });

  it('rejects invalid scene files', () => {
    const result = tryValidateScene(JSON.stringify({ type: 'other' }));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Not a Diagrammer/);
  });

  it('normalizes scene through deserialize path', () => {
    const scene = createScene({
      shapes: [{ id: 'a', type: 'rect', x: 1, y: 2, w: 3, h: 4 }],
    });
    const normalized = normalizeScene(JSON.stringify(scene));
    const restored = deserializeScene(normalized);
    expect(restored.shapes[0].w).toBe(3);
    expect(restored.styleDefaults.fontFamily).toBe('Caveat');
  });
});

describe('agent fromSpec', () => {
  it('builds a scene from nodes and edges', () => {
    const scene = fromSpec({
      title: 'Login Flow',
      nodes: [
        { id: 'user', type: 'rect', x: 100, y: 100, w: 140, h: 70, label: 'User' },
        { id: 'api', type: 'rect', x: 400, y: 100, w: 140, h: 70, label: 'API' },
      ],
      edges: [
        { from: 'user', to: 'api', label: 'POST /login' },
      ],
    });

    expect(scene.title).toBe('Login Flow');
    expect(scene.shapes).toHaveLength(3);

    const edge = scene.shapes.find((s) => s.type === 'arrow');
    expect(edge).toBeTruthy();
    expect(edge.fromShapeId).toBe('user');
    expect(edge.toShapeId).toBe('api');
    expect(edge.text).toBe('POST /login');
  });

  it('passes raw shapes through', () => {
    const scene = fromSpec({
      title: 'Raw',
      shapes: [rect({ id: 'box', x: 0, y: 0, w: 80, h: 40, text: 'Hi' })],
    });
    expect(scene.shapes).toHaveLength(1);
    expect(scene.shapes[0].text).toBe('Hi');
  });

  it('round-trips through app deserializeScene', () => {
    const scene = fromSpec({
      title: 'Round trip',
      nodes: [
        { id: 'a', type: 'rect', x: 0, y: 0, w: 100, h: 60, label: 'A' },
        { id: 'b', type: 'ellipse', x: 200, y: 0, w: 100, h: 60, label: 'B' },
      ],
      edges: [{ from: 'a', to: 'b' }],
    });

    const restored = deserializeScene(scene);
    expect(restored.shapes).toHaveLength(3);
    expect(restored.documentTitle).toBe('Round trip');
  });

  it('supports manual arrow shapes in spec', () => {
    const scene = fromSpec({
      title: 'Manual',
      shapes: [
        rect({ id: 'a', x: 0, y: 0, w: 80, h: 40 }),
        rect({ id: 'b', x: 200, y: 0, w: 80, h: 40 }),
        arrow({ id: 'link', x1: 80, y1: 20, x2: 200, y2: 20, fromShapeId: 'a', toShapeId: 'b' }),
      ],
    });
    const restored = deserializeScene(scene);
    expect(restored.shapes).toHaveLength(3);
  });
});
