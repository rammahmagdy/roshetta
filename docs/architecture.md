# Roshetta architecture

## High level

```
Client (Next.js 15, port 3000)
  ↓ multipart/form-data
Express API (port 4000)
  POST /api/prescriptions  ──┐
                              │  upload middleware (multer, memory storage)
                              │  10 MB limit · JPEG/PNG/HEIC/PDF only
                              ▼
                       runPipeline(image, onEvent)
                       │
                       ├──▶ stage 1: preprocessor       (REAL, sharp)
                       │      input:  Buffer + mimeType
                       │      output: { processedImage, width, height, channels, format }
                       │
                       ├──▶ stage 2: ocr-reader         (MOCK, deterministic by SHA-1)
                       │      input:  processed image
                       │      output: { rawText, detectedLines }
                       │
                       ├──▶ stage 3: nlp-parser         (REAL parser, MOCK input)
                       │      input:  rawText
                       │      output: { medications, warnings }
                       │
                       └──▶ stage 4: alternatives-finder (MOCK dataset)
                              input:  medications
                              output: { alternativesByMedicationId }

  ↑ text/event-stream
  stage_start  · stage_complete · pipeline_complete (or pipeline_error)
```

## The swap-in boundary

Each stage lives in **one file** under `server/src/pipeline/`, exports **one
async function**, and its input/output types live in `shared/types/pipeline.ts`.
That's the contract. Anything else (the orchestrator, the controller, the SSE
wiring, the UI) consumes only those types.

To wire a real vision provider, you change exactly one file's *body* — never
its signature.

### How to swap a stage in 5 steps

1. **Pick the stage file** in `server/src/pipeline/` (e.g. `ocr-reader.ts`).
2. **Keep the exported function name and signature**:
   ```ts
   export async function runOcrReader(input: OcrInput): Promise<OcrOutput>;
   ```
3. **Replace the body** with a real provider call. Read the image bytes from
   `input.processedImage`, await the provider, and assemble the response into
   the existing output shape.
4. **Add the provider SDK** (or use `fetch`) and put the API key in `.env`.
   Read it via `process.env.YOUR_KEY` inside the stage — never commit keys.
5. **Re-run** `npm test` and `npm run smoke`. If both pass, the swap is done.
   The orchestrator, the SSE controller, and the client all kept their contract.

This is SC-006 in the spec: a single-stage swap completes in under 15 minutes.

## Why SSE over a POST

The progress contract (FR-010) requires per-stage updates while the pipeline
runs. The browser's native `EventSource` cannot POST a file, so we use a single
`fetch` POST whose response is a `text/event-stream`, consumed via a
`ReadableStream` reader on the client side. One round-trip, one socket, no
"create job then poll" indirection.

## Why a separate Express server (not Next API routes)

The user brief specifies a `/roshetta/server/{routes,controllers,middleware,models,pipeline}/`
layout. We honor that literally — the pipeline is owned by the Express server.
The Next.js app is a thin client. In production a single deployable could
collapse them; for the local MVP, keeping them separate makes the boundary
inspectable.

## What is NOT in this MVP

- No real vision / LLM provider calls. No API keys.
- No database, no persistence, no per-user history.
- No authentication. No multi-tenant isolation beyond per-request memory.
- No cloud / Docker / CI scaffolding.
- No Arabic / RTL UI. English only for v1.
