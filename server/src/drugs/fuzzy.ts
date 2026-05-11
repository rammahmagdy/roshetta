// =============================================================================
// fuzzy — typo-tolerant matching of a user-typed query against the local
// brand index. Uses Damerau-Levenshtein on lowercase tokens with a length
// normaliser so "agumntin" still maps to "augmentin".
// =============================================================================

import { KNOWN_BRANDS, type BrandInfo } from '../pipeline/nlp/brands.js';
import alternativesData from '../pipeline/data/alternatives.json' with { type: 'json' };
import type { DrugMatch } from '@roshetta/shared/drug.js';
import type { TherapeuticAlternative } from '@roshetta/shared/prescription.js';

// -----------------------------------------------------------------------------
// Build a flat brand index once at module load. Combines the canonical brand
// dictionary (KNOWN_BRANDS) with every alternative brand listed in
// alternatives.json. Each entry records its source country so the UI can
// hint where the brand is sold.
// -----------------------------------------------------------------------------

export interface IndexedBrand {
  key: string;             // normalized lookup key (lowercase)
  canonicalName: string;   // display name
  activeIngredient: string;
  form: string;
  countries: string[];     // ['EG'], ['SA', 'AE'], etc.
}

type AlternativesDataset = Record<string, Partial<Record<string, TherapeuticAlternative[]>>>;
const ALTERNATIVES = alternativesData as AlternativesDataset;

function buildIndex(): IndexedBrand[] {
  const byKey = new Map<string, IndexedBrand>();

  // 1. seed from KNOWN_BRANDS — every key is a valid lookup.
  for (const [key, info] of Object.entries(KNOWN_BRANDS)) {
    const entry: IndexedBrand = {
      key: key.toLowerCase(),
      canonicalName: info.canonical,
      activeIngredient: info.activeIngredient,
      form: info.form,
      countries: ['EG'],
    };
    byKey.set(entry.key, entry);
    // also seed the canonical name itself
    const canonKey = info.canonical.toLowerCase();
    if (!byKey.has(canonKey)) byKey.set(canonKey, { ...entry, key: canonKey });
  }

  // 2. enrich with every alternative brand mentioned in alternatives.json.
  for (const [activeIngredient, byCountry] of Object.entries(ALTERNATIVES)) {
    for (const [country, alts] of Object.entries(byCountry)) {
      if (!alts) continue;
      for (const alt of alts) {
        const key = alt.brandName.toLowerCase();
        const existing = byKey.get(key);
        if (existing) {
          if (!existing.countries.includes(country)) existing.countries.push(country);
        } else {
          byKey.set(key, {
            key,
            canonicalName: alt.brandName,
            activeIngredient: alt.activeIngredient || activeIngredient,
            form: alt.form || '',
            countries: [country],
          });
        }
      }
    }
  }

  return Array.from(byKey.values());
}

export const BRAND_INDEX: readonly IndexedBrand[] = buildIndex();

// -----------------------------------------------------------------------------
// Damerau-Levenshtein distance (handles single-char swaps too: "augmentin"
// vs "agumentin"). Returns the edit distance between two lowercase strings.
// -----------------------------------------------------------------------------

function distance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const dp: number[][] = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) dp[i]![0] = i;
  for (let j = 0; j <= bl; j++) dp[0]![j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,          // deletion
        dp[i]![j - 1]! + 1,          // insertion
        dp[i - 1]![j - 1]! + cost,   // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i]![j] = Math.min(dp[i]![j]!, dp[i - 2]![j - 2]! + 1); // transposition
      }
    }
  }
  return dp[al]![bl]!;
}

// Score: 1.0 = exact, decreases with edit distance, normalised by length.
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const len = Math.max(a.length, b.length);
  if (len === 0) return 0;
  return 1 - distance(a, b) / len;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export interface FuzzyResult {
  brand: IndexedBrand;
  score: number;
}

/**
 * Return up to `limit` brand matches for the query. Filters out anything
 * below `minScore` so we don't suggest junk for a 1-letter query.
 */
export function fuzzySearch(
  query: string,
  { limit = 8, minScore = 0.55 }: { limit?: number; minScore?: number } = {},
): FuzzyResult[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const scored: FuzzyResult[] = [];
  for (const brand of BRAND_INDEX) {
    // prefix bonus — typing "neur" should rank Neurorubine over Nexium.
    const startsWith = brand.key.startsWith(q);
    const containsQuery = brand.key.includes(q);
    let score = similarity(brand.key, q);
    if (startsWith) score = Math.max(score, 0.85);
    else if (containsQuery && q.length >= 3) score = Math.max(score, 0.7);

    if (score >= minScore) scored.push({ brand, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** Convenience: convert fuzzy results to the public DrugMatch shape. */
export function toDrugMatches(results: FuzzyResult[]): DrugMatch[] {
  return results.map((r) => ({
    canonicalName: r.brand.canonicalName,
    activeIngredient: r.brand.activeIngredient,
    score: r.score,
    source: 'local',
  }));
}

/** Look up the full BrandInfo for a canonical name (case-insensitive). */
export function lookupLocalByName(name: string): BrandInfo | null {
  const key = name.toLowerCase().trim();
  if (KNOWN_BRANDS[key]) return KNOWN_BRANDS[key];
  // Try the indexed map (covers alternatives-only brands).
  const match = BRAND_INDEX.find((b) => b.key === key);
  if (match) {
    return {
      canonical: match.canonicalName,
      activeIngredient: match.activeIngredient,
      form: match.form,
    };
  }
  return null;
}
