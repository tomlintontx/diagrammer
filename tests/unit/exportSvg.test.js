import { describe, it, expect } from 'vitest';
import { exportSceneToSvg } from '../../src/scene/exportSvg.js';

describe('exportSvg security', () => {
  it('escapes malicious attribute values', () => {
    const svg = exportSceneToSvg(
      [{
        type: 'rect',
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        strokeColor: '#000" onload="alert(1)',
        fillColor: '#fff',
        strokeWidth: 1,
        opacity: 1,
      }],
      { minX: 0, minY: 0, width: 10, height: 10 },
    );
    expect(svg).not.toContain('onload="alert(1)');
    expect(svg).toContain('&quot;');
  });

  it('escapes text content', () => {
    const svg = exportSceneToSvg(
      [{
        type: 'text',
        x: 0,
        y: 0,
        text: '<script>alert(1)</script>',
        fontSize: 16,
        fontFamily: 'Caveat',
        strokeColor: '#000',
        opacity: 1,
      }],
      { minX: 0, minY: 0, width: 100, height: 40 },
    );
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('exports centered inline text for box shapes', () => {
    const svg = exportSceneToSvg(
      [{
        type: 'rect',
        x: 0,
        y: 0,
        w: 120,
        h: 60,
        text: 'Centered label',
        fontSize: 18,
        fontFamily: 'Caveat',
        strokeColor: '#000',
        fillColor: '#ffd8d8',
        strokeWidth: 1,
        opacity: 1,
      }],
      { minX: 0, minY: 0, width: 120, height: 60 },
    );
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('dominant-baseline="middle"');
    expect(svg).toContain('Centered');
  });
});
