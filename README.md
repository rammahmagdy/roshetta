# Roshetta · روشتة

Read a handwritten doctor's prescription, identify every medicine, and surface
similar alternatives available in your country — all from a single photo.

**Live**: [roshetta.net](https://roshetta.net)

Bilingual UI (English + العربية). Built for the MENA market.

> ⚠️ Roshetta is **not** an official or safe medical source. Always confirm
> any medication, dose, or alternative with your doctor or pharmacist.

---

## What it does

1. You upload or snap a photo of the prescription.
2. A vision pipeline reads the writing (OpenRouter → Claude / GPT-4o / Gemini
   in cascade or ensemble; falls back to bundled mocks if no key is set).
3. A parser identifies each medication: brand, dose, frequency, duration,
   indication.
4. The alternatives finder returns equivalents that share the same active
   ingredient, **filtered to the user's country** (detected via IP /
   timezone / manual override).

## Stack

| Layer | Tech |
|---|---|
| Client | Next.js 15 · React 19 · TypeScript · IBM Plex Sans Arabic + Inter |
| Server | Express 4 · TypeScript (tsx) · Multer · sharp |
| Pipeline | OpenRouter SDK (OpenAI-compatible) + direct SDKs for Anthropic / OpenAI / Google as backups |
| Shared | Workspace package with types, zod schemas, design tokens, country catalog |
| Tests | vitest (24 unit + integration tests) |
| Deploy | Docker · Railway |

## Run locally

```bash
git clone https://github.com/rammahmagdy/roshetta.git
cd roshetta
cp .env.example .env       # then paste your OpenRouter key
npm install
npm run dev
# → http://localhost:3000 (client), http://localhost:4000/api (server)
```

If no API key is set the pipeline runs against bundled mock samples, so the
demo works offline.

## Architecture

- `client/` — Next.js App Router. Bilingual UI, country switcher, smooth
  scroll, modular CSS under `app/styles/`.
- `server/` — Express + multi-stage vision pipeline (`pipeline/`):
  preprocessor → ocr-reader → nlp-parser → alternatives-finder. Real OCR
  is hot-swappable via `pipeline/providers/`.
- `shared/` — workspace package: TS types, zod schemas, country catalog,
  and the **design system** at `shared/design/`.
- `tests/` — vitest unit + integration; smoke script under `tests/e2e/`.

## Deploy

See [`DEPLOY.md`](./DEPLOY.md) for Railway (recommended), Fly, Render,
Cloud Run, and local Docker instructions.

## Vision provider configuration

| Env var | Notes |
|---|---|
| `OPENROUTER_API_KEY` | Single key for Claude / GPT / Gemini. Recommended. |
| `OPENROUTER_MODELS` | csv of model ids, e.g. `anthropic/claude-sonnet-4.5,openai/gpt-4o` |
| `OPENROUTER_MODE` | `cascade` (default) or `ensemble` |
| `ANTHROPIC_API_KEY` | Direct backup |
| `OPENAI_API_KEY` | Direct backup |
| `GEMINI_API_KEY` | Direct backup |

Full list in [`.env.example`](./.env.example).

## License

Proprietary. All rights reserved.
