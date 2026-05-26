# Agent Diagram Creation Guide

This guide is for AI agents and developers who need to create uploadable Diagrammer files without using the app UI.

## Quick start

1. Write a diagram spec JSON (see below).
2. Run the local CLI:

```bash
npm run diagrammer -- from-spec examples/login-flow.spec.json -o login.diagrammer.json
npm run diagrammer -- validate login.diagrammer.json
```

3. Upload `login.diagrammer.json` in the Diagrammer app via **Open** / file import.

No server, daemon, or network access is required.

## CLI commands

| Command | Purpose |
|---------|---------|
| `diagrammer from-spec <spec> -o <out>` | Convert an agent spec to a `.diagrammer.json` scene file |
| `diagrammer validate <file>` | Validate a scene file or agent spec |
| `diagrammer normalize <file> -o <out>` | Normalize an existing scene to canonical v2 |
| `diagrammer schema [scene\|spec]` | Print JSON Schema for scene or spec format |
| `diagrammer help` | Show usage |

Install locally from the repo:

```bash
npm install
npm run diagrammer -- help
```

## Recommended agent workflow

When a user asks for an uploadable Diagrammer diagram:

1. Create a spec file with `nodes` and `edges` (or raw `shapes`).
2. Run `diagrammer from-spec spec.json -o output.diagrammer.json`.
3. Run `diagrammer validate output.diagrammer.json`.
4. Return the generated `.diagrammer.json` file to the user.

Always validate before returning the file.

## Agent spec format

Use this format when building diagrams from concepts like architecture, flowcharts, or system diagrams.

```json
{
  "title": "Login Flow",
  "backgroundColor": "#f8f9fa",
  "nodes": [
    {
      "id": "user",
      "type": "rect",
      "x": 100,
      "y": 120,
      "w": 160,
      "h": 80,
      "label": "User Browser",
      "style": { "fillColor": "#d0ebff" }
    },
    {
      "id": "api",
      "type": "rect",
      "x": 420,
      "y": 120,
      "w": 160,
      "h": 80,
      "label": "Auth API",
      "style": { "fillColor": "#d3f9d8" }
    }
  ],
  "edges": [
    {
      "from": "user",
      "to": "api",
      "label": "POST /login"
    }
  ]
}
```

### Node fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Stable identifier used by edges |
| `type` | no | `rect`, `ellipse`, `diamond`, `text`, or `label` (alias for text). Default: `rect` |
| `x`, `y` | yes | Top-left position in canvas coordinates |
| `w`, `h` | no | Size. Defaults vary by type |
| `label` or `text` | no | Text shown inside the shape |
| `style` | no | Optional stroke/fill/font overrides |

### Edge fields

| Field | Required | Description |
|-------|----------|-------------|
| `from` | yes | Source node id |
| `to` | yes | Target node id |
| `type` | no | `arrow` (default) or `line` |
| `label` or `text` | no | Label rendered on the connector |

The CLI auto-routes edges between node sides and sets `fromShapeId`, `toShapeId`, `fromSide`, `toSide`, and endpoint coordinates.

## Raw shapes format

For full control, pass raw scene shapes instead of nodes/edges:

```json
{
  "title": "Custom Diagram",
  "shapes": [
    {
      "id": "box",
      "type": "rect",
      "x": 100,
      "y": 100,
      "w": 140,
      "h": 70,
      "text": "Service"
    }
  ]
}
```

See `schema/diagrammer-v2.schema.json` for the full scene shape schema.

## Scene file format

The output file is Diagrammer JSON v2:

```json
{
  "type": "diagrammer",
  "version": 2,
  "title": "Untitled",
  "backgroundColor": "#f8f9fa",
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "styleDefaults": { "...": "..." },
  "shapes": []
}
```

Supported shape types: `rect`, `ellipse`, `diamond`, `arrow`, `line`, `pencil`, `text`.

## Layout conventions

- Place nodes left-to-right for flows; top-to-bottom for hierarchies.
- Leave ~80–120px horizontal spacing between nodes.
- Typical node size: `w: 140–180`, `h: 60–90`.
- Use `style.fillColor` to distinguish layers or roles.
- Put edge labels on important connections only.

## Limits

| Limit | Value |
|-------|-------|
| Max shapes | 10,000 |
| Max import file size | 5 MB |
| Max text length | 64 KB per shape |
| Max pencil points | 50,000 |

## JSON Schema

- Scene format: `schema/diagrammer-v2.schema.json`
- Agent spec: `schema/diagrammer-spec.schema.json`

Print from CLI:

```bash
npm run diagrammer -- schema scene
npm run diagrammer -- schema spec
```

## Programmatic API

Agents running inside this repo can import the scene module directly:

```javascript
import { fromSpec, createScene, tryValidateScene, rect, arrow } from './src/agent/index.js';

const scene = fromSpec({ title: 'Demo', nodes: [...], edges: [...] });
const result = tryValidateScene(JSON.stringify(scene));
```

## Upload in the app

1. Open the Diagrammer app.
2. Use the file import / open control.
3. Select the generated `.diagrammer.json` file.
4. The diagram renders on the canvas and can be edited further.

The app validates files on import using the same normalization logic as the CLI.
