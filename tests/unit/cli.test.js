import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deserializeScene } from '../../src/scene/format.js';

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cli = resolve(root, 'cli/diagrammer.js');

async function runCli(args) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [cli, ...args], { cwd: root });
  return { stdout, stderr };
}

describe('diagrammer CLI', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'diagrammer-cli-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('prints help', async () => {
    const { stdout } = await runCli(['help']);
    expect(stdout).toMatch(/diagrammer from-spec/);
  });

  it('from-spec writes an importable scene file', async () => {
    const specPath = join(tempDir, 'spec.json');
    const outPath = join(tempDir, 'out.diagrammer.json');
    const spec = {
      title: 'CLI Test',
      nodes: [
        { id: 'a', type: 'rect', x: 10, y: 10, w: 100, h: 50, label: 'A' },
        { id: 'b', type: 'rect', x: 200, y: 10, w: 100, h: 50, label: 'B' },
      ],
      edges: [{ from: 'a', to: 'b' }],
    };
    await writeFile(specPath, JSON.stringify(spec));

    const { stdout } = await runCli(['from-spec', specPath, '-o', outPath]);
    expect(stdout).toMatch(/Wrote/);

    const text = await readFile(outPath, 'utf8');
    const scene = JSON.parse(text);
    expect(scene.type).toBe('diagrammer');
    expect(deserializeScene(scene).shapes).toHaveLength(3);
  });

  it('validate accepts scene and spec files', async () => {
    const specPath = join(tempDir, 'spec.json');
    const scenePath = join(tempDir, 'scene.json');
    const spec = {
      nodes: [{ id: 'a', type: 'rect', x: 0, y: 0, w: 50, h: 50, label: 'A' }],
    };
    await writeFile(specPath, JSON.stringify(spec));
    await runCli(['from-spec', specPath, '-o', scenePath]);

    const specResult = await runCli(['validate', specPath]);
    expect(specResult.stdout).toMatch(/Valid spec/);

    const sceneResult = await runCli(['validate', scenePath]);
    expect(sceneResult.stdout).toMatch(/Valid Diagrammer scene/);
  });

  it('normalize rewrites a scene file', async () => {
    const inPath = join(tempDir, 'in.json');
    const outPath = join(tempDir, 'out.json');
    await writeFile(inPath, JSON.stringify({
      type: 'diagrammer',
      version: 2,
      title: 'Normalize me',
      shapes: [{ id: 'a', type: 'rect', x: 0, y: 0, w: 10, h: 10 }],
    }));

    await runCli(['normalize', inPath, '-o', outPath]);
    const scene = JSON.parse(await readFile(outPath, 'utf8'));
    expect(scene.type).toBe('diagrammer');
    expect(scene.styleDefaults.fontFamily).toBe('Caveat');
  });
});
