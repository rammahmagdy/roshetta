import type { StructuredMedication, VisionProvider, VisionRequest, VisionResult } from './types.js';
import { READ_PROMPT } from './types.js';

// =============================================================================
// OpenRouter provider — single key, many models. Asks the model for STRICT
// JSON, parses it, and returns StructuredMedication[] directly (skipping the
// downstream regex parser). Falls back to text-mode on parse failure.
// =============================================================================

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

interface RawJsonPayload {
  medications: Array<{
    raw_name?: string;
    canonical_name?: string;
    active_ingredient?: string;
    strength?: string;
    form?: string;
    frequency?: string;
    duration?: string;
    indication?: string;
    confidence?: string;
  }>;
  warnings?: string[];
}

interface ModelCall {
  model: string;
  rawResponse: string;
  medications: StructuredMedication[];
  warnings: string[];
}

function normalizeMedication(m: RawJsonPayload['medications'][number]): StructuredMedication {
  const rawName = (m.raw_name ?? '').trim();
  const canonicalName = (m.canonical_name ?? '').trim() || rawName || 'Unrecognized item';
  const isUnrecognized =
    (m.confidence ?? '').toLowerCase() === 'unrecognized' ||
    /illegible/i.test(rawName) ||
    canonicalName.toLowerCase() === 'unrecognized item';
  return {
    rawName: rawName || canonicalName,
    canonicalName,
    activeIngredient: (m.active_ingredient ?? '').trim(),
    strength: (m.strength ?? '').trim(),
    form: (m.form ?? '').trim(),
    frequency: (m.frequency ?? '').trim() || 'as directed',
    duration: (m.duration ?? '').trim() || 'as needed',
    indication: (m.indication ?? '').trim(),
    confidence: isUnrecognized ? 'unrecognized' : 'confident',
  };
}

function reconstructText(medications: StructuredMedication[]): string {
  return medications
    .map((m) => `Rx ${m.canonicalName} ${m.strength}\n   ${m.frequency} · ${m.duration}`)
    .join('\n\n');
}

/** Strip ```json fences if the model added them anyway. */
function stripCodeFence(s: string): string {
  const t = s.trim();
  if (t.startsWith('```')) {
    return t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return t;
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
  if (!rawResponse) return null;

  let parsed: RawJsonPayload;
  try {
    parsed = JSON.parse(stripCodeFence(rawResponse)) as RawJsonPayload;
  } catch (err) {
    console.warn(`[openrouter] ${model} returned non-JSON: ${rawResponse.slice(0, 160)}`);
    return null;
  }

  const medications = Array.isArray(parsed.medications)
    ? parsed.medications.map(normalizeMedication)
    : [];
  const warnings = Array.isArray(parsed.warnings)
    ? parsed.warnings.filter((w): w is string => typeof w === 'string')
    : [];

  return { model, rawResponse, medications, warnings };
}

function isUsable(call: ModelCall | null): call is ModelCall {
  if (!call) return false;
  // Any non-empty medications array OR any warnings means we got something
  // — even a clear "couldn't read this" warning is more useful than fallback
  // to the mock.
  return call.medications.length > 0 || call.warnings.length > 0;
}

function score(call: ModelCall): number {
  // Confident medications count double; unrecognized still count.
  return call.medications.reduce(
    (sum, m) => sum + (m.confidence === 'confident' ? 2 : 1),
    0,
  );
}

function rank(results: ModelCall[]): ModelCall | null {
  const usable = results.filter(isUsable);
  if (usable.length === 0) return null;
  return usable.sort((a, b) => score(b) - score(a))[0]!;
}

async function runCascade(image: Buffer, models: string[]): Promise<VisionResult | null> {
  for (const model of models) {
    try {
      const call = await callOneModel(model, image);
      if (isUsable(call)) return toVisionResult(call);
      console.warn(`[openrouter] ${model} returned no usable medications, falling through`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[openrouter] ${model} failed: ${msg}`);
    }
  }
  return null;
}

async function runEnsemble(image: Buffer, models: string[]): Promise<VisionResult | null> {
  const settled = await Promise.allSettled(models.map((m) => callOneModel(m, image)));
  const calls = settled
    .filter((r): r is PromiseFulfilledResult<ModelCall | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((c): c is ModelCall => c !== null);
  const winner = rank(calls);
  if (!winner) return null;
  return toVisionResult(winner, true);
}

function toVisionResult(call: ModelCall, ensemble = false): VisionResult {
  const rawText = reconstructText(call.medications);
  const detectedLines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
  return {
    provider: `openrouter${ensemble ? ':ensemble' : ''}:${call.model}`,
    rawText,
    detectedLines,
    medications: call.medications,
    warnings: call.warnings,
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
    if (models.length === 0) throw new Error('OPENROUTER_MODELS is empty');
    const out =
      mode() === 'ensemble'
        ? await runEnsemble(req.image, models)
        : await runCascade(req.image, models);
    if (!out) throw new Error('OpenRouter: no model returned a usable result');
    return out;
  },
};
