# Diagrammer

A client-side canvas diagram editor built with vanilla JavaScript, Vite, and Rough.js.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Build and run Playwright smoke tests |
| `npm run ci` | Lint, build, unit tests, and e2e |

## Scene format

Diagrams are saved as JSON with `type: "diagrammer"` and `version: 2`. Shapes include rectangles, ellipses, diamonds, arrows, lines, pencil strokes, and text. Style defaults and viewport state are stored alongside shapes.

## Agent CLI

AI agents can create uploadable diagram files using the local CLI. See [docs/agent-diagrammer.md](./docs/agent-diagrammer.md).

```bash
npm run diagrammer -- from-spec examples/login-flow.spec.json -o login.diagrammer.json
npm run diagrammer -- validate login.diagrammer.json
```

## Autosave

Edits are debounced to `localStorage` under the key `diagrammer:autosave`. On reload, the app restores the autosaved scene and shows a banner with an option to discard it.

## Testing notes

- Unit tests live in `tests/unit/`.
- E2E tests build the app with `VITE_E2E=true` so minimal test hooks are available in the production bundle used by Playwright.

## Security

See [SECURITY.md](./SECURITY.md) for the threat model and untrusted-input handling.
