# Gateia Examples

This folder contains small, focused examples that demonstrate how to use Gateia.

## How to run

From the repo root:

```bash
npm install
npx tsx examples/01-basic-block.ts
```

Replace the filename with any example below.

## Examples

- `01-basic-block.ts`: Basic contract validation + built-in policies; blocks refund guarantees and PII.
- `02-audit-mode.ts`: Shows audit mode (violations recorded, output allowed).
- `03-markdown-json.ts`: Auto-parses JSON from fenced code blocks.
- `04-multi-policy.ts`: Multiple policies and combined violations.
- `05-custom-rewrite.ts`: Custom rewrite policy that redacts a word.
- `06-markup-policy.ts`: Blocks unsafe markup, allows plain https URLs.
