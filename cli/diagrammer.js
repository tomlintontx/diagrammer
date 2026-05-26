#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromSpec, tryValidateScene, normalizeScene } from '../src/agent/index.js';
import { MAX_IMPORT_BYTES } from '../src/core/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = resolve(__dirname, '../schema');

const HELP = `diagrammer — create and validate Diagrammer scene files

Usage:
  diagrammer validate <file>              Validate a scene or spec file
  diagrammer normalize <file> -o <out>    Normalize a scene file to canonical v2
  diagrammer from-spec <spec> -o <out>      Convert an agent spec to a scene file
  diagrammer schema [scene|spec]            Print JSON Schema path or contents
  diagrammer help                           Show this help

Examples:
  diagrammer from-spec login-spec.json -o login.diagrammer.json
  diagrammer validate login.diagrammer.json
  diagrammer normalize draft.json -o cleaned.diagrammer.json

Agent workflow:
  1. Write a spec JSON with nodes and edges (or raw shapes).
  2. Run \`diagrammer from-spec spec.json -o diagram.diagrammer.json\`.
  3. Run \`diagrammer validate diagram.diagrammer.json\`.
  4. Upload the .diagrammer.json file in the Diagrammer app.
`;

function parseArgs(argv) {
  const args = [...argv];
  const positional = [];
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      flags.output = args[++i];
    } else if (arg === '--pretty') {
      flags.pretty = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

async function readJsonFile(filePath) {
  const abs = resolve(filePath);
  const text = await readFile(abs, 'utf8');
  if (Buffer.byteLength(text, 'utf8') > MAX_IMPORT_BYTES) {
    throw new Error('File is too large to import');
  }
  try {
    return { text, data: JSON.parse(text), path: abs };
  } catch {
    throw new Error('Invalid JSON');
  }
}

async function writeJsonFile(filePath, data, pretty = true) {
  const text = pretty ? `${JSON.stringify(data, null, 2)}\n` : `${JSON.stringify(data)}\n`;
  await writeFile(resolve(filePath), text, 'utf8');
}

function isSceneFile(data) {
  return data && typeof data === 'object' && data.type === 'diagrammer';
}

function isSpecFile(data) {
  return data && typeof data === 'object' && (Array.isArray(data.nodes) || Array.isArray(data.shapes));
}

async function cmdValidate(filePath) {
  const { text, data } = await readJsonFile(filePath);

  if (isSceneFile(data)) {
    const result = tryValidateScene(text);
    if (!result.valid) {
      console.error(`Invalid scene: ${result.error}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Valid Diagrammer scene (${result.scene.shapes.length} shapes)`);
    return;
  }

  if (isSpecFile(data)) {
    try {
      const scene = fromSpec(data);
      const result = tryValidateScene(JSON.stringify(scene));
      if (!result.valid) {
        console.error(`Spec produced invalid scene: ${result.error}`);
        process.exitCode = 1;
        return;
      }
      console.log(`Valid spec (${data.nodes?.length ?? 0} nodes, ${data.edges?.length ?? 0} edges)`);
      return;
    } catch (err) {
      console.error(`Invalid spec: ${err.message}`);
      process.exitCode = 1;
      return;
    }
  }

  console.error('File is neither a Diagrammer scene (type: "diagrammer") nor an agent spec (nodes/shapes).');
  process.exitCode = 1;
}

async function cmdNormalize(filePath, outputPath, pretty) {
  const { text } = await readJsonFile(filePath);
  const scene = normalizeScene(text);
  await writeJsonFile(outputPath, scene, pretty);
  console.log(`Wrote ${resolve(outputPath)}`);
}

async function cmdFromSpec(specPath, outputPath, pretty) {
  const { data } = await readJsonFile(specPath);
  const scene = fromSpec(data);
  const result = tryValidateScene(JSON.stringify(scene));
  if (!result.valid) {
    throw new Error(`Generated invalid scene: ${result.error}`);
  }
  await writeJsonFile(outputPath, scene, pretty);
  console.log(`Wrote ${resolve(outputPath)} (${scene.shapes.length} shapes)`);
}

async function cmdSchema(which = 'scene') {
  const file = which === 'spec'
    ? resolve(SCHEMA_DIR, 'diagrammer-spec.schema.json')
    : resolve(SCHEMA_DIR, 'diagrammer-v2.schema.json');
  const text = await readFile(file, 'utf8');
  process.stdout.write(text);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(HELP);
    return;
  }

  try {
    const { positional, flags } = parseArgs(rest);

    switch (command) {
      case 'validate': {
        const file = positional[0];
        if (!file) throw new Error('Missing file argument');
        await cmdValidate(file);
        break;
      }
      case 'normalize': {
        const file = positional[0];
        const output = flags.output;
        if (!file || !output) throw new Error('Usage: diagrammer normalize <file> -o <out>');
        await cmdNormalize(file, output, flags.pretty !== false);
        break;
      }
      case 'from-spec': {
        const file = positional[0];
        const output = flags.output;
        if (!file || !output) throw new Error('Usage: diagrammer from-spec <spec> -o <out>');
        await cmdFromSpec(file, output, flags.pretty !== false);
        break;
      }
      case 'schema': {
        await cmdSchema(positional[0] ?? 'scene');
        break;
      }
      default:
        console.error(`Unknown command: ${command}\n`);
        process.stdout.write(HELP);
        process.exitCode = 1;
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

main();
