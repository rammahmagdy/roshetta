import { describe, expect, it } from 'vitest';
import { runAlternativesFinder } from '../../../server/src/pipeline/alternatives-finder.js';
import type { MedicationEntry } from '../../../shared/types/prescription.js';

function med(overrides: Partial<MedicationEntry> = {}): MedicationEntry {
  return {
    id: 'm1',
    rawName: 'Augmentin',
    canonicalName: 'Augmentin',
    activeIngredient: 'Amoxicillin + Clavulanate',
    strength: '1 g',
    form: 'tablet',
    frequency: 'every 12 hours',
    duration: '7 days',
    indication: 'sinusitis',
    confidence: 'confident',
    ...overrides,
  };
}

describe('alternatives-finder', () => {
  it('returns at least one alternative for a known active ingredient', async () => {
    const out = await runAlternativesFinder({ medications: [med()] });
    expect(out.alternativesByMedicationId['m1']!.length).toBeGreaterThanOrEqual(1);
    for (const alt of out.alternativesByMedicationId['m1']!) {
      expect(alt.activeIngredient.toLowerCase()).toContain('amoxicillin');
    }
  });

  it('returns an empty list for unrecognized medications', async () => {
    const out = await runAlternativesFinder({
      medications: [med({ id: 'm2', confidence: 'unrecognized', activeIngredient: '' })],
    });
    expect(out.alternativesByMedicationId['m2']).toEqual([]);
  });

  it('returns an empty list for unknown active ingredients', async () => {
    const out = await runAlternativesFinder({
      medications: [med({ id: 'm3', activeIngredient: 'TotallyMadeUpDrug' })],
    });
    expect(out.alternativesByMedicationId['m3']).toEqual([]);
  });

  it('does not list the prescribed brand as its own alternative', async () => {
    const out = await runAlternativesFinder({
      medications: [med({ id: 'm4', canonicalName: 'Hibiotic' })],
    });
    for (const alt of out.alternativesByMedicationId['m4']!) {
      expect(alt.brandName.toLowerCase()).not.toBe('hibiotic');
    }
  });
});
