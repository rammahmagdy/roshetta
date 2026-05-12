import type { VisionProvider, VisionRequest, VisionResult } from './types.js';
import { READ_PROMPT } from './types.js';
import {
  isUsable,
  parseVisionResponse,
  reconstructText,
  scoreResponse,
  type ParsedVisionResponse,
} from './_parse.js';

// =============================================================================
// OpenRouter provider — single key, many models. Asks the model for STRICT
// JSON, parses via the shared helper, and returns StructuredMedication[].
// Supports cascade (try-each-until-success) and ensemble (call all in
// parallel, pick the highest-scoring response) modes.
// =============================================================================

const ENDPOINT = 'https://openrouter.ai/api/v1';

const DEFAULT_MODELS = [
  'anthropic/claude-sonnet-4.5',
  'openai/gpt-4o',
  'google/gemini-2.5-flash',
] as const;

function configuredModels(): string[] {
  const raw = process.env.OPENROUTER_MODELS;
  if (!raw) return [...DEFAULT_MODELS];
  return raw.split(',').map((m) => m.trim()).filter((m) => m.length > 0);
}

function mode(): 'cascade' | 'ensemble' {
  return process.env.OPENROUTER_MODE === 'ensemble' ? 'ensemble' : 'cascade';
}

interface ModelCall {
  model: string;
  parsed: ParsedVisionResponse;
}

async function callOneModel(model: string, image: Buffer): Promise<ModelCall | null> {
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
    max_tokens: 1500,
    response_format: { type: 'json_object' },
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

  const rawResponse = response.choices[0]?.message?.content?.trim() ?? '';
  const parsed = parseVisionResponse(rawResponse);
  if (!isUsable(parsed)) {
    console.warn(`[openrouter] ${model} returned no usable medications`);
    return null;
  }
  return { model, parsed };
}

function toResult(call: ModelCall, ensemble = false): VisionResult {
  const rawText = reconstructText(call.parsed.medications);
  return {
    provider: `openrouter${ensemble ? ':ensemble' : ''}:${call.model}`,
    rawText,
    detectedLines: rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length,
    medications: call.parsed.medications,
    warnings: call.parsed.warnings,
    confidence: 'high',
  };
}

async function runCascade(image: Buffer, models: string[]): Promise<VisionResult | null> {
  for (const model of models) {
    try {
      const call = await callOneModel(model, image);
      if (call) return toResult(call);
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
    .filter((r): r is PromiseFulfilledResult<ModelCall | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((c): c is ModelCall => c !== null);
  if (successes.length === 0) return null;
  const winner = successes.sort((a, b) => scoreResponse(b.parsed) - scoreResponse(a.parsed))[0]!;
  return toResult(winner, true);
}

export const openrouterVision: VisionProvider = {
  name: 'openrouter',
  isEnabled: () => Boolean(process.env.OPENROUTER_API_KEY),
  async run(req: VisionRequest): Promise<VisionResult> {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not set');
    }
    const models = configuredModels();
    if (models.length === 0) throw new Error('OPENROUTER_MODELS is empty');
    const out =
      mode() === 'ensemble'
        ? await runEnsemble(req.image, models)
        : await runCascade(req.image, models);
    if (!out) throw new Error('OpenRouter: no model returned a usable result');
    return out;
  },
};
