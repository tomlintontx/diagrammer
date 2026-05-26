# Security

Diagrammer is a static, client-only drawing app. There is no backend, authentication, or server-side storage.

## Threat model

Primary untrusted inputs:

- JSON scene files opened by the user
- Autosaved JSON restored from `localStorage`
- Exported SVG files opened in other applications

The app does not execute imported JSON as code. Shapes are validated and normalized before use.

## Safeguards

- Import size limits and shape/point/text caps
- Schema validation for colors, fonts, enums, and numeric ranges
- SVG attribute and text escaping on export
- Font-family sanitization in the text editor
- Autosave quota checks with user-visible warnings

## Local data

Autosave stores diagram content in browser `localStorage`. Diagrammer does not encrypt or protect this data from other scripts on the same origin. Do not treat autosave as confidential storage.

## Reporting

If you find a security issue, open a private report with reproduction steps and affected files.
