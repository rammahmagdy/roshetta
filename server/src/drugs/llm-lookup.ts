// =============================================================================
// llm-lookup — ask OpenRouter for canonical drug info given a (possibly
// misspelled) name. Returns a normalized DrugInfo skeleton; the caller is
// responsible for merging country-specific alternatives from the local
// dataset on top.
// =============================================================================

import type { CountryCode } from '@roshetta/shared/country.js';
import type { TherapeuticAlternative } from '@roshetta/shared/prescription.js';

const ENDPOINT = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
const FALLBACK_MODELS = ['openai/gpt-4o', 'google/gemini-2.0-flash-exp:free'];

/** Raw JSON shape we ask the model to produce. */
interface LlmDrugPayload {
  canonical_name: string;
  active_ingredient: string;
  summary_en: string;
  summary_ar: string;
  form: string;
  strength: string;
  indication: string;
  warnings: string[];
  alternative_brands: Array<{
    brand_name: string;
    active_ingredient: string;
    strength: string;
    form: string;
    reason: string;
  }>;
}

function buildPrompt(query: string, country: CountryCode): string {
  return `You are a medical drug information specialist. The user typed a medicine name (possibly misspelled). Return canonical, accurate info in STRICT JSON.

User typed: "${query}"
User's market (for picking locally-available alternatives): ${country}

Required output schema (return ONLY this JSON object, no markdown, no preamble):

{
  "canonical_name": "Correct brand name as commonly spelled",
  "active_ingredient": "Active ingredient(s)",
  "summary_en": "1–2 sentence plain-English summary of what this medicine does",
  "summary_ar": "نفس الملخص بالعربية المصرية البسيطة، جملة أو اتنين",
  "form": "tablet | capsule | syrup | sachet | nasal drops | topical gel | suspension | …",
  "strength": "Common strength like '500 mg' or empty string if it varies",
  "indication": "What condition(s) this treats",
  "warnings": ["max 2 short practical warnings — allergies, contraindications, common side effects"],
  "alternative_brands": [
    { "brand_name": "...", "active_ingredient": "...", "strength": "...", "form": "...", "reason": "Why it's an alternative" }
  ]
}

Rules:
- Output ONLY the JSON object. No code fence, no commentary.
- If the typed name is not a recognizable medicine, return canonical_name="UNKNOWN" and empty fields.
- Prefer alternatives that are sold in the ${country} market. If you don't know what's in that market, fall back to global generics with the same active ingredient.
- 2 alternatives is enough; do not exceed 4.
- Warnings should be patient-facing and non-alarming.
- Arabic summary uses Egyptian colloquial when natural ("الدوا ده بيعالج…").
`;
}

async function callModel(model: string, query: string, country: CountryCode): Promise<LlmDrugPayload | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({
    apiKey,
    baseURL: ENDPOINT,
    defaultHeaders: {
      'HTTP-Referer': process.env.OPENROUTER_REFERER ?? 'https://roshetta.net',
      'X-Title': 'Roshetta',
    },
  });

  const completion = await client.chat.completions.create({
    model,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You return strict JSON only. No code fences.' },
      { role: 'user', content: buildPrompt(query, country) },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LlmDrugPayload;
    if (!parsed.canonical_name || parsed.canonical_name === 'UNKNOWN') return null;
    return parsed;
  } catch (err) {
    console.warn(`[drug-llm] ${model} returned non-JSON:`, raw.slice(0, 120));
    return null;
  }
}

export interface LlmLookupResult {
  canonicalName: string;
  activeIngredient: string;
  summaryEn: string;
  summaryAr: string;
  form: string;
  strength: string;
  indication: string;
  warnings: string[];
  alternatives: TherapeuticAlternative[];
  model: string;
}

/**
 * Cascade: try the primary model, fall through to backups on failure.
 * Returns null if every model fails OR the drug is unknown.
 */
export async function llmLookupDrug(
  query: string,
  country: CountryCode,
): Promise<LlmLookupResult | null> {
  const order = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  const overrideModels = process.env.OPENROUTER_MODELS;
  const models = overrideModels
    ? overrideModels.split(',').map((m) => m.trim()).filter(Boolean)
    : order;

  for (const model of models) {
    try {
      const payload = await callModel(model, query, country);
      if (!payload) continue;
      return {
        canonicalName: payload.canonical_name,
        activeIngredient: payload.active_ingredient,
        summaryEn: payload.summary_en,
        summaryAr: payload.summary_ar,
        form: payload.form,
        strength: payload.strength,
        indication: payload.indication,
        warnings: Array.isArray(payload.warnings) ? payload.warnings.slice(0, 3) : [],
        alternatives: (payload.alternative_brands ?? []).slice(0, 4).map((a) => ({
          brandName: a.brand_name,
          activeIngredient: a.active_ingredient,
          strength: a.strength,
          form: a.form,
          reason: a.reason,
        })),
        model,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[drug-llm] ${model} failed: ${msg}`);
    }
  }
  return null;
}
