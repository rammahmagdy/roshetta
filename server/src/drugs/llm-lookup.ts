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
  dosing_en: string;
  dosing_ar: string;
  side_effects_en: string[];
  side_effects_ar: string[];
  contraindications_en: string[];
  contraindications_ar: string[];
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
  return `You are a medical drug information specialist. The user typed a medicine name (possibly misspelled). Return canonical, accurate, patient-facing info in STRICT JSON.

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
  "dosing_en": "Typical adult dose in 1 short sentence (e.g. '1 tablet every 12 hours after meals')",
  "dosing_ar": "نفس الجرعة بالعربية المصرية البسيطة",
  "side_effects_en": ["up to 5 common side effects, short phrases"],
  "side_effects_ar": ["نفس القائمة بالعربية، عبارات قصيرة"],
  "contraindications_en": ["up to 3 short phrases — when NOT to take it"],
  "contraindications_ar": ["نفس القائمة بالعربية"],
  "warnings": ["max 2 short practical warnings (allergies, dependencies)"],
  "alternative_brands": [
    { "brand_name": "...", "active_ingredient": "...", "strength": "...", "form": "...", "reason": "Why it's an alternative" }
  ]
}

Rules:
- Output ONLY the JSON object. No code fence, no commentary.
- If the typed name is not a recognizable medicine, return canonical_name="UNKNOWN" and empty fields/arrays everywhere.
- Prefer alternatives that are sold in the ${country} market. If you don't know what's in that market, fall back to global generics with the same active ingredient.
- 2–3 alternatives is plenty; never exceed 4.
- side_effects are short patient-facing phrases like "drowsiness" / "stomach upset" — not medical jargon.
- contraindications are short phrases like "pregnancy" / "kidney disease" / "under 12 years old".
- Always include EVERY field. If you don't know something, return an empty string or empty array — never omit a key.
- Arabic mirrors use Egyptian colloquial when natural ("الدوا ده بيعالج…", "اللي بياخدوا…").
- Arabic side_effects_ar and contraindications_ar arrays MUST be the same length as their English counterparts (one-to-one translation).
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
  dosingEn: string;
  dosingAr: string;
  sideEffectsEn: string[];
  sideEffectsAr: string[];
  contraindicationsEn: string[];
  contraindicationsAr: string[];
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
      const cap = (arr: unknown, n: number): string[] =>
        Array.isArray(arr) ? (arr.filter((x): x is string => typeof x === 'string').slice(0, n)) : [];
      return {
        canonicalName: payload.canonical_name,
        activeIngredient: payload.active_ingredient,
        summaryEn: payload.summary_en,
        summaryAr: payload.summary_ar,
        form: payload.form,
        strength: payload.strength,
        indication: payload.indication,
        dosingEn: payload.dosing_en ?? '',
        dosingAr: payload.dosing_ar ?? '',
        sideEffectsEn: cap(payload.side_effects_en, 5),
        sideEffectsAr: cap(payload.side_effects_ar, 5),
        contraindicationsEn: cap(payload.contraindications_en, 3),
        contraindicationsAr: cap(payload.contraindications_ar, 3),
        warnings: cap(payload.warnings, 3),
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
