import type { AlternativesInput, AlternativesOutput } from '@roshetta/shared/pipeline.js';
import type { TherapeuticAlternative } from '@roshetta/shared/prescription.js';
import { type CountryCode, DEFAULT_COUNTRY } from '@roshetta/shared/country.js';
import alternativesData from './data/alternatives.json' with { type: 'json' };

const MIN_DELAY_MS = 800;
const MAX_DELAY_MS = 1500;

type AlternativesDataset = Record<string, Partial<Record<CountryCode, TherapeuticAlternative[]>>>;
const ALTERNATIVES = alternativesData as AlternativesDataset;

function normalizeKey(activeIngredient: string): string {
  return activeIngredient.toLowerCase().trim();
}

function pickAlternativesForCountry(
  ingredient: string,
  country: CountryCode,
): TherapeuticAlternative[] {
  const bucket = ALTERNATIVES[normalizeKey(ingredient)];
  if (!bucket) return [];

  // Priority: requested country → GLOBAL → any other available country.
  const direct = bucket[country];
  if (direct && direct.length > 0) return direct;

  const global = bucket.GLOBAL;
  if (global && global.length > 0) return global;

  for (const entries of Object.values(bucket)) {
    if (entries && entries.length > 0) return entries;
  }
  return [];
}

// MOCK: looks up alternatives in the bundled JSON dataset, filtered by the
// caller's country. Swap this body for a real drug-formulary API call later.
export async function runAlternativesFinder(
  input: AlternativesInput & { country?: CountryCode },
): Promise<AlternativesOutput> {
  const delay = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
  await new Promise((resolve) => setTimeout(resolve, delay));

  const country: CountryCode = input.country ?? DEFAULT_COUNTRY;

  const alternativesByMedicationId: Record<string, TherapeuticAlternative[]> = {};
  for (const med of input.medications) {
    if (med.confidence === 'unrecognized' || !med.activeIngredient) {
      alternativesByMedicationId[med.id] = [];
      continue;
    }
    const found = pickAlternativesForCountry(med.activeIngredient, country);
    // Exclude exact-brand matches so we never list the prescribed brand as
    // its own alternative.
    alternativesByMedicationId[med.id] = found.filter(
      (alt) => alt.brandName.toLowerCase() !== med.canonicalName.toLowerCase(),
    );
  }

  return { alternativesByMedicationId };
}
