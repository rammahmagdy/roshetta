import type { VisionProvider, VisionRequest, VisionResult } from './types.js';
import { READ_PROMPT } from './types.js';

// =============================================================================
// OpenRouter provider — single key, many models.
// =============================================================================
//
// OpenRouter is OpenAI-compatible, so we use the `openai` SDK pointed at
// `https://openrouter.ai/api/v1`. One key gives access to:
//   - anthropic/claude-3.5-sonnet (best handwriting reader)
//   - openai/gpt-4o
//   - google/gemini-pro-1.5 / gemini-2.0-flash
//   - + many more.
//
// We expose two modes:
//   1. cascade  (default) — try a primary model; on failure or empty result,
//                            try the next; etc. Fast, cost-effective.
//   2. ensemble — call N models in parallel and reconcile (longest non-empty
//                  result wins; in the future, a Claude "judge" can merge).
//
// Configure via env:
//   OPENROUTER_API_KEY=sk-or-v1-...                      (required)
//   OPENROUTER_MODE=cascade | ensemble                  (default: cascade)
//   OPENROUTER_MODELS=anthropic/claude-3.5-sonnet,
//                     openai/gpt-4o,
//                     google/gemini-2.0-flash-exp:free
//   OPENROUTER_REFERER=https://roshetta.net             (used by OpenRouter
//                                                        for site attribution)
//
// The dependency `openai` is already in the server's deps (used by the direct
// OpenAI provider too) — we reuse it here.

const ENDPOINT = 'https://openrouter.ai/api/v1';

const DEFAULT_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o',
  'google/gemini-2.0-flash-exp:free',
] as const;

function configuredModels(): string[] {
  const raw = process.env.OPENROUTER_MODELS;
  if (!raw) return [...DEFAULT_MODELS];
  return raw
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
}

function mode(): 'cascade' | 'ensemble' {
  return process.env.OPENROUTER_MODE === 'ensemble' ? 'ensemble' : 'cascade';
}

async function callOneModel(
  model: string,
  image: Buffer,
): Promise<{ model: string; rawText: string }> {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: ENDPOINT,
    defaultHeaders: {
      'HTTP-Referer': process.env.OPENROUTER_REFERER ?? 'https://roshetta.net',
      'X-Title': 'Roshetta',
    },
  });

  const base64 = image.toString('base64');
  const response = await client.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: READ_PROMPT },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${base64}`, detail: 'high' },
          },
        ],
      },
    ],
  });

  const rawText = response.choices[0]?.message?.content?.trim() ?? '';
  return { model, rawText };
}

function isUsable(rawText: string): boolean {
  if (!rawText) return false;
  if (rawText.includes('----no readable prescription----')) return false;
  // Reject any response that has zero Rx lines.
  return /^\s*Rx\s+/im.test(rawText);
}

function rank(results: { model: string; rawText: string }[]): { model: string; rawText: string } | null {
  const usable = results.filter((r) => isUsable(r.rawText));
  if (usable.length === 0) return null;
  // Longest non-empty wins for now — more lines / detail = more useful.
  // (A future improvement: an LLM "judge" call that picks/merges.)
  return usable.sort((a, b) => b.rawText.length - a.rawText.length)[0]!;
}

async function runCascade(image: Buffer, models: string[]): Promise<VisionResult | null> {
  for (const model of models) {
    try {
      const { rawText } = await callOneModel(model, image);
      if (isUsable(rawText)) {
        const detectedLines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
        return { provider: `openrouter:${model}`, rawText, detectedLines, confidence: 'high' };
      }
      console.warn(`[openrouter] ${model} returned no usable text, falling through`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[openrouter] ${model} failed: ${msg}`);
    }
  }
  return null;
}

async function runEnsemble(image: Buffer, models: string[]): Promise<VisionResult | null> {
  const settled = await Promise.allSettled(models.map((m) => callOneModel(m, image)));
  const successes = settled
    .filter((r): r is PromiseFulfilledResult<{ model: string; rawText: string }> => r.status === 'fulfilled')
    .map((r) => r.value);
  const winner = rank(successes);
  if (!winner) return null;
  const detectedLines = winner.rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
  return {
    provider: `openrouter:ensemble:${winner.model}`,
    rawText: winner.rawText,
    detectedLines,
    confidence: 'high',
  };
}

export const openrouterVision: VisionProvider = {
  name: 'openrouter',
  isEnabled: () => Boolean(process.env.OPENROUTER_API_KEY),
  async run(req: VisionRequest): Promise<VisionResult> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not set');
    }
    const models = configuredModels();
    if (models.length === 0) {
      throw new Error('OPENROUTER_MODELS is empty');
    }
    const out = mode() === 'ensemble'
      ? await runEnsemble(req.image, models)
      : await runCascade(req.image, models);
    if (!out) throw new Error('OpenRouter: no model returned a usable result');
    return out;
  },
};
