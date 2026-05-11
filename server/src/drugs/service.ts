// =============================================================================
// service — orchestrate search and lookup.
//
// search:
//   1) fuzzy match the local brand index — instant, no API call
//   2) if 0 strong local matches and the query is >= 3 chars, ask the LLM
//      to suggest the canonical name (the LLM is great at typo correction)
//
// lookup:
//   1) look the name up in the local index; if found, hydrate from
//      KNOWN_BRANDS + alternatives.json for the requested country
//   2) call the LLM regardless — its summary + warnings are richer than
//      the local dataset, and it can fill alternatives for countries where
//      we have no local data
//   3) merge: local alternatives take precedence (curated), LLM alternatives
//      are appended for variety
// =============================================================================

import type { DrugInfo, DrugMatch, DrugSearchResponse, DrugLookupResponse } from '@roshetta/shared/drug.js';
import type { CountryCode } from '@roshetta/shared/country.js';
import type { TherapeuticAlternative } from '@roshetta/shared/prescription.js';
import { fuzzySearch, lookupLocalByName, toDrugMatches } from './fuzzy.js';
import { llmLookupDrug } from './llm-lookup.js';
import alternativesData from '../pipeline/data/alternatives.json' with { type: 'json' };

type AlternativesDataset = Record<string, Partial<Record<CountryCode, TherapeuticAlternative[]>>>;
const ALTERNATIVES = alternativesData as AlternativesDataset;

const STRONG_LOCAL_SCORE = 0.75;
const MIN_QUERY_FOR_LLM = 3;

function alternativesForIngredient(
  ingredient: string,
  country: CountryCode,
  excludeBrand?: string,
): TherapeuticAlternative[] {
  const bucket = ALTERNATIVES[ingredient.toLowerCase().trim()];
  if (!bucket) return [];
  const tried: TherapeuticAlternative[][] = [
    bucket[country] ?? [],
    bucket.GLOBAL ?? [],
  ];
  for (const list of tried) {
    if (list && list.length > 0) {
      return list.filter(
        (alt) => !excludeBrand || alt.brandName.toLowerCase() !== excludeBrand.toLowerCase(),
      );
    }
  }
  return [];
}

function dedupeAlternatives(...lists: TherapeuticAlternative[][]): TherapeuticAlternative[] {
  const seen = new Set<string>();
  const out: TherapeuticAlternative[] = [];
  for (const list of lists) {
    for (const alt of list) {
      const key = `${alt.brandName.toLowerCase()}|${alt.strength}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(alt);
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// search
// -----------------------------------------------------------------------------

export async function searchDrugs(
  query: string,
  country: CountryCode,
): Promise<DrugSearchResponse> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { query: '', exact: false, matches: [] };
  }

  const local = fuzzySearch(trimmed);
  const exact = local.length > 0 && local[0]!.score >= 0.99;
  const strong = local.filter((m) => m.score >= STRONG_LOCAL_SCORE);
  const matches: DrugMatch[] = toDrugMatches(local);

  // If the local match is weak AND the query looks meaningful, ask the LLM.
  if (strong.length === 0 && trimmed.length >= MIN_QUERY_FOR_LLM && process.env.OPENROUTER_API_KEY) {
    try {
      const llm = await llmLookupDrug(trimmed, country);
      if (llm && llm.canonicalName) {
        const exists = matches.some(
          (m) => m.canonicalName.toLowerCase() === llm.canonicalName.toLowerCase(),
        );
        if (!exists) {
          matches.unshift({
            canonicalName: llm.canonicalName,
            activeIngredient: llm.activeIngredient,
            score: 0.9,
            source: 'llm',
          });
        }
      }
    } catch (err) {
      console.warn('[drug-search] llm fallback failed:', err);
    }
  }

  return { query: trimmed, exact, matches };
}

// -----------------------------------------------------------------------------
// lookup
// -----------------------------------------------------------------------------

export async function lookupDrug(
  name: string,
  country: CountryCode,
): Promise<DrugLookupResponse> {
  const trimmed = name.trim();
  const local = lookupLocalByName(trimmed);

  // Always try the LLM — it adds the summary + warnings the local dataset doesn't carry.
  let llm = null;
  if (process.env.OPENROUTER_API_KEY) {
    try {
      llm = await llmLookupDrug(trimmed, country);
    } catch (err) {
      console.warn('[drug-lookup] llm failed:', err);
    }
  }

  const canonicalName = llm?.canonicalName || local?.canonical || trimmed;
  const activeIngredient = llm?.activeIngredient || local?.activeIngredient || '';
  const form = llm?.form || local?.form || '';

  // Country-aware local alternatives, then LLM-suggested ones for variety.
  const localAlts = alternativesForIngredient(activeIngredient, country, canonicalName);
  const llmAlts = (llm?.alternatives ?? []).filter(
    (alt) => alt.brandName.toLowerCase() !== canonicalName.toLowerCase(),
  );
  const alternatives = dedupeAlternatives(localAlts, llmAlts).slice(0, 6);

  let source: DrugInfo['source'] = 'local';
  if (llm && !local) source = 'llm';
  else if (llm && local) source = 'merged';

  const info: DrugInfo = {
    canonicalName,
    activeIngredient,
    summary: llm?.summaryEn || `${canonicalName} contains ${activeIngredient}.`,
    summaryAr: llm?.summaryAr,
    form,
    strength: llm?.strength,
    indication: llm?.indication || local?.defaultIndication || '',
    warnings: llm?.warnings ?? [],
    alternatives,
    country,
    source,
  };

  return { info };
}
