# Deploying Roshetta

This project ships as a single Docker container that runs both the Express
API and the Next.js client side-by-side. Designed for Railway but works on
any Docker-friendly host (Fly, Render, Cloud Run, etc.).

## What deploys

```
Public traffic ──► Next.js (port $PORT, Railway default 8080)
                     └── rewrites /api/* ──► Express (internal port 4000)
                                              └── runs the vision pipeline
                                                   • Chandra-compatible OCR endpoint (optional)
                                                   • OpenRouter (default fallback)
                                                   • Anthropic / OpenAI / Google
                                                   • mock fallback
```

## Required env vars (Railway → "Variables")

| Key | Purpose |
|---|---|
| `CHANDRA_OCR_URL` *(optional)* | Chandra-compatible OCR HTTP endpoint. If configured, Roshetta sends prescription images there before the LLM cascade. |
| `CHANDRA_OCR_API_KEY` *(optional)* | Bearer token for the Chandra OCR endpoint. |
| `CHANDRA_OCR_MODE` *(optional)* | `prefer` (default), `only`, or `off`. Use `only` only when a dedicated Chandra service is healthy. |
| `CHANDRA_OCR_TIMEOUT_MS` *(optional)* | OCR endpoint timeout. Default: `45000`. |
| `OPENROUTER_API_KEY` | Single key, routes to Claude / GPT / Gemini. Recommended fallback. |
| `OPENROUTER_MODELS` *(optional)* | csv of model ids. Default: `anthropic/claude-sonnet-4.5,openai/gpt-4o,google/gemini-2.5-flash` |
| `OPENROUTER_MODE` *(optional)* | `cascade` (default) or `ensemble` |
| `ANTHROPIC_API_KEY` *(optional)* | Direct Claude key (used if OpenRouter fails). |
| `OPENAI_API_KEY` *(optional)* | Direct GPT key. |
| `GEMINI_API_KEY` *(optional)* | Direct Gemini key. |
| `SERVER_PORT` *(optional)* | Defaults to 4000. Internal only. |
| `PORT` | **Railway injects this automatically** for the public process. |

If no key is set, the pipeline still runs — it falls back to bundled mock
samples so the demo never breaks. Chandra itself is a separate Python/vLLM
service; keep it outside the Node container and point `CHANDRA_OCR_URL` at its
HTTP endpoint when ready.

## Deploy on Railway (Docker)

1. **Sign in**: <https://railway.app>.
2. **New Project → Deploy from GitHub repo**. Point it at this repo.
3. Railway will detect `Dockerfile` + `railway.json` automatically.
4. In **Variables**, paste `OPENROUTER_API_KEY` (and any others). **Don't**
   commit the real value to git — keep it only in Railway's variables UI
   and in your local `.env`.
5. **Deploy**. The container exposes Next.js on `$PORT` and Express
   internally on `4000`.
6. Railway gives you a public URL like `roshetta-production-xxxx.up.railway.app`.

### Health check

The container's `/api/health` endpoint returns `{ "status": "ok" }`.
Railway's `railway.json` already points its health check there.

## Deploy on Fly.io / Render / Cloud Run

The same `Dockerfile` works. Override these on the platform:

- Set the public port to the value the platform expects (most use `$PORT`).
- Set `SERVER_PORT=4000` (or anything you like).
- Set `API_BASE_URL=http://localhost:4000` so Next.js rewrites locally.

## Run the container locally

```bash
# Build
docker build -t roshetta .

# Run (the .env in repo root is the source of truth)
docker run --rm -p 8080:3000 -p 4000:4000 --env-file .env roshetta

# Visit
open http://localhost:8080
```

## Updating the OpenRouter key

The key is held only in:

1. Your local `roshetta/.env` (gitignored).
2. Railway → Variables → `OPENROUTER_API_KEY`.

Rotate from <https://openrouter.ai/keys> if it's ever exposed.

## Smoke test the deployed instance

```bash
# Health
curl https://YOUR-APP.up.railway.app/api/health

# Geo (Railway injects CF-IPCountry / x-forwarded-* automatically)
curl https://YOUR-APP.up.railway.app/api/geo

# Decode a prescription
curl -X POST \
  -F image=@some-prescription.jpg \
  -H "X-Country: EG" \
  https://YOUR-APP.up.railway.app/api/prescriptions
```

## Cost notes

- **Mock fallback** is free.
- **OpenRouter** charges per call to whichever model wins the cascade.
  - `anthropic/claude-sonnet-4.5` is the strongest reader but the priciest.
  - `google/gemini-2.5-flash` is much cheaper but less accurate on hard
    handwriting.
  - With `OPENROUTER_MODE=cascade` and the default order, most images cost
    one Claude call; only failures fall through.
  - With `OPENROUTER_MODE=ensemble` you pay for all 3 calls in parallel —
    higher accuracy, higher bill.
