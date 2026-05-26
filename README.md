# Diagrammer

A client-side canvas diagram editor with a hand-drawn look. Built with vanilla JavaScript, Vite, and [Rough.js](https://roughjs.com/). Everything runs in the browser — no backend, no account, no network required after load.

Create diagrams in the UI, save them as portable JSON, export to PNG or SVG, or generate diagrams programmatically with the included CLI for AI agents and automation.

## Features

- **Drawing tools** — select, rectangle, ellipse, diamond, arrow, line, pencil, text, and eraser
- **Hand-drawn styling** — adjustable roughness, stroke/fill styles (solid, hachure, cross-hatch, zigzag), opacity, and colors
- **Editing** — move, resize, nudge, duplicate, copy/paste, undo/redo, and z-order controls
- **Navigation** — pan and zoom (scroll wheel or trackpad); click the zoom indicator to reset
- **Import / export** — open and save `.diagrammer.json` scene files; export the full canvas or selection as PNG, or the scene as SVG
- **Autosave** — edits are debounced to `localStorage` and restored on reload
- **Agent CLI** — convert high-level node/edge specs into uploadable scene files without using the UI

## Quick start

**Requirements:** Node.js 20+

```bash
git clone https://github.com/tomlintontx/diagrammer.git
cd diagrammer
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

For a production build:

```bash
npm run build
npm run preview
```

The output in `dist/` is a static site you can host anywhere.

## Using the editor

1. Pick a tool from the toolbar (or use the keyboard shortcuts below).
2. Draw shapes on the canvas. Double-click text shapes to edit inline.
3. Use **Save** to download a `.diagrammer.json` file, or **Open** to import one.
4. Export with **PNG**, **SVG**, or **Sel PNG** (selection only).

Press **?** in the app for the full shortcut list.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `V` | Select |
| `R` | Rectangle |
| `E` | Ellipse |
| `D` | Diamond |
| `A` | Arrow |
| `L` | Line |
| `P` | Pencil |
| `T` | Text |
| `X` | Eraser |
| `Delete` | Delete selection |
| Arrow keys | Nudge 1px |
| `Shift` + arrows | Nudge 10px |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Shift+Z` | Redo |
| `Ctrl/Cmd+C/V/X` | Copy / paste / cut |
| `Ctrl/Cmd+D` | Duplicate |
| `Alt` + drag | Duplicate while dragging |
| `Ctrl/Cmd+S` | Save JSON |
| `?` | Show shortcuts |

## File formats

Diagrammer uses two related JSON formats:

| Format | Purpose |
|--------|---------|
| **Scene file** (`.diagrammer.json`) | Canonical format the app reads and writes. Contains `type: "diagrammer"`, `version: 2`, shapes, style defaults, and viewport state. |
| **Agent spec** | Higher-level format with `nodes` and `edges` (or raw `shapes`) for programmatic diagram generation. Converted to a scene file by the CLI. |

Supported shape types: rectangle, ellipse, diamond, arrow, line, pencil stroke, and text.

JSON Schemas live in [`schema/`](./schema/):

- [`diagrammer-v2.schema.json`](./schema/diagrammer-v2.schema.json) — scene files
- [`diagrammer-spec.schema.json`](./schema/diagrammer-spec.schema.json) — agent specs

Print a schema from the CLI:

```bash
npm run diagrammer -- schema scene
npm run diagrammer -- schema spec
```

## Agent CLI

AI agents and scripts can create uploadable diagram files without opening the app. See the full guide in [docs/agent-diagrammer.md](./docs/agent-diagrammer.md).

```bash
# Convert a spec to a scene file
npm run diagrammer -- from-spec examples/login-flow.spec.json -o login.diagrammer.json

# Validate a scene or spec
npm run diagrammer -- validate login.diagrammer.json

# Normalize an existing scene to canonical v2
npm run diagrammer -- normalize login.diagrammer.json -o normalized.diagrammer.json
```

| Command | Description |
|---------|-------------|
| `from-spec <spec> -o <out>` | Convert an agent spec to a scene file |
| `validate <file>` | Validate a scene file or agent spec |
| `normalize <file> -o <out>` | Normalize a scene to canonical v2 |
| `schema [scene\|spec]` | Print JSON Schema |
| `help` | Show usage |

## Autosave

Edits are debounced to `localStorage` under the key `diagrammer:autosave`. On reload, the app restores the autosaved scene and shows a banner with an option to discard it.

## Development

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Build and run Playwright smoke tests |
| `npm run ci` | Lint, build, unit tests, and e2e |
| `npm run diagrammer -- <cmd>` | Run the agent CLI |

### Project layout

```
cli/           Agent CLI entry point
src/
  agent/       Spec-to-scene conversion
  core/        Scene model, history, geometry, validation
  input/       Tools, pan/zoom, hit testing, drawing
  render/      Canvas rendering with Rough.js
  scene/       JSON format, export, autosave
  ui/          Toolbar, panels, modals, text editor
schema/        JSON Schemas for scene and spec formats
examples/      Sample agent specs
tests/         Vitest unit tests and Playwright e2e
```

### Testing

- Unit tests live in `tests/unit/`.
- E2E tests build the app with `VITE_E2E=true` so minimal test hooks are available in the production bundle used by Playwright.
- CI runs on every push to `main` via GitHub Actions (`.github/workflows/ci.yml`).

## Security

Diagrammer is a static, client-only app. Imported JSON is validated and never executed as code. See [SECURITY.md](./SECURITY.md) for the threat model and untrusted-input handling.
