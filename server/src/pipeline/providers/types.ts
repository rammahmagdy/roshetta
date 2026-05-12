// =============================================================================
// Vision provider contract. Every provider implements `run` and returns
// EITHER raw text (legacy) OR a structured list of medications (preferred —
// the latter skips the regex parser downstream entirely).
// =============================================================================

import type { ParseConfidence } from '@roshetta/shared/prescription.js';

export interface VisionRequest {
  image: Buffer;
  promptHints?: {
    country?: string;
    languages?: readonly ('ar' | 'en')[];
  };
}

/** One medication entry as returned by the vision LLM, before the orchestrator
 *  assigns IDs. Mirrors MedicationEntry minus the runtime-only `id` field. */
export interface StructuredMedication {
  rawName: string;
  canonicalName: string;
  activeIngredient: string;
  strength: string;
  form: string;
  frequency: string;
  duration: string;
  indication: string;
  confidence: ParseConfidence;
}

export interface VisionResult {
  provider: string;
  /** Reconstructed text — always present so the legacy parser path still
   *  works if a provider can't return structured data. */
  rawText: string;
  detectedLines: number;
  /** Preferred path: provider returned per-medication entries directly. */
  medications?: StructuredMedication[];
  /** Lines the model couldn't read. */
  warnings?: string[];
  confidence?: string;
}

export interface VisionProvider {
  readonly name: string;
  readonly isEnabled: () => boolean;
  readonly run: (req: VisionRequest) => Promise<VisionResult>;
}

// -----------------------------------------------------------------------------
// READ_PROMPT — sent to every vision provider. Asks for STRICT JSON with
// normalized medications. The prompt enumerates known Egyptian / MENA brands
// so the model can pick a canonical spelling, but it ALSO instructs the
// model to never substitute a similar-sounding drug.
// -----------------------------------------------------------------------------

export const READ_PROMPT = `You are reading a HANDWRITTEN Egyptian / MENA medical prescription. The image contains a doctor's handwriting in mixed Arabic and English. Return STRICT JSON.

OUTPUT SCHEMA (return ONLY this JSON object, no markdown, no commentary):

{
  "medications": [
    {
      "raw_name": "The EXACT text as written on the prescription. Do NOT replace with a similar-sounding drug.",
      "canonical_name": "Normalized brand name with correct spelling. If raw_name matches a known brand below, use the canonical spelling. If you do NOT recognize the brand, return the raw_name verbatim — do not invent a substitute.",
      "active_ingredient": "Active ingredient(s) in English. Empty string if you genuinely don't know.",
      "strength": "Strength with unit (e.g. '500 mg', '100 mg/5 ml', '1%', '15 mg'). Empty string if absent.",
      "form": "tablet | capsule | syrup | sachet | nasal drops | topical gel | cream | suspension | mouthwash | ointment | drops | spray",
      "frequency": "How often, in plain English (e.g. 'twice daily', 'every 8 hours', 'as needed').",
      "duration": "How long (e.g. '7 days', 'as directed').",
      "indication": "What it's used for in 2–4 words.",
      "confidence": "confident | unrecognized"
    }
  ],
  "warnings": [ "Add a short string for every line you could not read confidently." ]
}

CRITICAL RULES:
1. READ EXACTLY what's written. Never substitute a similar-sounding drug. If you see "Captin" output "Captin" — it's a real Egyptian paracetamol brand, NOT Augmentin.
2. Egyptian doctors often write "Rx" before each medication. Arabic dosing usually appears BELOW the drug name.
3. If a word is genuinely illegible, set raw_name to "----illegible----", canonical_name to "Unrecognized item", confidence to "unrecognized", and add an entry to "warnings". Never invent a drug.
4. Always include EVERY medication you see, even partially-readable ones. Mark them confidence: "unrecognized" if you're not sure.
5. Common Egyptian / MENA brands (use canonical spelling when confident):
   • Antibiotics: Augmentin, Hibiotic, Curam, Klacid, Zithromax, Cipro
   • Pain / inflammation: Catafast, Cataflam, Voltaren, Adwiflam, Mobic, Mobitil, Movalis, Olfen, Brufen, Profinal, Rivo, Aspocid
   • Muscle relaxants: Multi Relax (methocarbamol), Myolastan, Sirdalud, Myogesic
   • Stomach: Nexium, Motilium, Gaviscon, Pantoloc, Buscopan
   • Cardio: Concor, Cardicor, Lipitor, Atoris, Vastarel, Plavix
   • Vitamins / nerve: Multinerv, Neurorubine, Milga, Neuroton, Maxicalc, Riconia
   • Diabetes: Glucophage, Amaryl, Cidophage, Diapride
   • Allergy: Claritine, Telfast, Histazine, Lorinase
   • Pediatric / fever / pain: Captin (paracetamol — common "Captin 100" / "Captin 500"), Adol, Panadol, Cetal
   • Topical / dermatology: Maxi Care (moisturizing cream), Bioderma, Cetaphil
6. Doctor shorthand: TDS = three times daily, BID = twice daily, QID = four times daily, OD = once daily, PRN = as needed, HS = at bedtime.
7. Always include EVERY field. Empty string for unknowns. Never omit a key.
8. If the entire image is unreadable, return { "medications": [], "warnings": ["The prescription image could not be read. Please retake the photo in better lighting."] }.

Return ONLY the JSON object.`;
