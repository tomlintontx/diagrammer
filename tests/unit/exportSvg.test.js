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

  it('clips and wraps standalone text to its box', () => {
    const svg = exportSceneToSvg(
      [{
        id: 'freeform',
        type: 'text',
        x: 0,
        y: 0,
        w: 80,
        h: 40,
        text: 'This standalone text should wrap',
        fontSize: 16,
        fontFamily: 'Caveat',
        strokeColor: '#000',
        opacity: 1,
      }],
      { minX: 0, minY: 0, width: 100, height: 60 },
    );
    expect(svg).toContain('<clipPath id="clip-freeform">');
    expect(svg).toContain('width="80" height="40"');
    expect(svg).toContain('standa');
    expect(svg).toContain('text-anchor="start"');
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

  it('exports inline text horizontal and vertical alignment', () => {
    const svg = exportSceneToSvg(
      [{
        type: 'rect',
        x: 0,
        y: 0,
        w: 120,
        h: 60,
        text: 'Bottom right',
        textAlign: 'right',
        textVerticalAlign: 'bottom',
        fontSize: 18,
        fontFamily: 'Caveat',
        strokeColor: '#000',
        fillColor: '#ffd8d8',
        strokeWidth: 1,
        opacity: 1,
      }],
      { minX: 0, minY: 0, width: 120, height: 60 },
    );
    expect(svg).toContain('x="105"');
    expect(svg).toContain('text-anchor="end"');
  });

  it('exports bidirectional arrowheads', () => {
    const svg = exportSceneToSvg(
      [{
        type: 'arrow',
        x1: 0,
        y1: 0,
        x2: 40,
        y2: 0,
        arrowDirection: 'both',
        strokeColor: '#000',
        strokeWidth: 2,
        opacity: 1,
      }],
      { minX: -20, minY: -20, width: 80, height: 40 },
    );

    expect(svg).toContain('<line');
    expect(svg.match(/<path d="/g)).toHaveLength(2);
  });

  it('exports embedded raster images', () => {
    const src = 'data:image/png;base64,aGVsbG8=';
    const svg = exportSceneToSvg(
      [{
        type: 'image',
        src,
        x: 10,
        y: 20,
        w: 100,
        h: 80,
        opacity: 0.5,
      }],
      { minX: 0, minY: 0, width: 140, height: 120 },
    );

    expect(svg).toContain(`<image href="${src}"`);
    expect(svg).toContain('width="100" height="80"');
    expect(svg).toContain('opacity="0.5"');
  });
});
