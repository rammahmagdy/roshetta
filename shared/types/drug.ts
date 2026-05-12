// =============================================================================
// Drug lookup — types
// =============================================================================
// Roshetta's "find by name" feature: the user types a medicine name (possibly
// misspelled), we fuzzy-match the local brand index, and we ask an LLM via
// OpenRouter for canonical details and alternatives.
// =============================================================================

import type { TherapeuticAlternative } from './prescription.js';
import type { CountryCode } from './country.js';

/** One candidate match for a search query. Used in the autocomplete dropdown. */
export interface DrugMatch {
  /** Canonical brand name we'd like to display. */
  canonicalName: string;
  /** Active ingredient(s), if known. */
  activeIngredient: string;
  /** 0…1, higher = better match. Local matches are 0.5+, LLM are 0.85+. */
  score: number;
  /** Where the match came from — surfaced as a small badge in the UI. */
  source: 'local' | 'llm';
}

/** Full info card shown after the user picks a candidate (or hits Enter). */
export interface DrugInfo {
  /** Canonical brand name. */
  canonicalName: string;
  /** Active ingredient(s). */
  activeIngredient: string;
  /** 1–2 sentences explaining what the medicine treats. */
  summary: string;
  /** Same summary in Arabic, when the LLM returns one. */
  summaryAr?: string;
  /** Common dose form (tablet / syrup / capsule / topical gel / …). */
  form: string;
  /** Strength (e.g. "500 mg") if confidently known. */
  strength?: string;
  /** What the medicine is used for. */
  indication: string;
  /** Typical adult dosing in plain English, when the LLM is confident. */
  dosing?: string;
  /** Arabic mirror of the dosing line. */
  dosingAr?: string;
  /** Common side effects (≤ 5). */
  sideEffects?: string[];
  /** Arabic mirror of side effects. */
  sideEffectsAr?: string[];
  /** Contraindications — when NOT to take it. */
  contraindications?: string[];
  /** Arabic mirror of contraindications. */
  contraindicationsAr?: string[];
  /** Short list of practical warnings (allergies, dependencies, …). */
  warnings: string[];
  /** Country-aware therapeutic alternatives. */
  alternatives: TherapeuticAlternative[];
  /** Country whose market the alternatives are filtered for. */
  country: CountryCode;
  /** Did the info come from the local dataset, the LLM, or both? */
  source: 'local' | 'llm' | 'merged';
}

/** Server response payload for /api/drugs/search. */
export interface DrugSearchResponse {
  query: string;
  /** Did the query look like a brand we recognize directly? */
  exact: boolean;
  matches: DrugMatch[];
}

/** Server response payload for /api/drugs/lookup. */
export interface DrugLookupResponse {
  info: DrugInfo;
}
