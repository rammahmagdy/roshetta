import { describe, expect, it } from 'vitest';
import {
  DecodedPrescriptionSchema,
  MedicationEntrySchema,
  PipelineEventSchema,
} from '../../../shared/types/schemas.js';

describe('shared schemas', () => {
  it('round-trips a fully populated MedicationEntry', () => {
    const entry = {
      id: 'abc',
      rawName: 'Augmentin',
      canonicalName: 'Augmentin',
      activeIngredient: 'Amoxicillin + Clavulanate',
      strength: '1 g',
      form: 'tablet',
      frequency: 'every 12 hours',
      duration: '7 days',
      indication: 'sinusitis',
      confidence: 'confident' as const,
    };
    expect(MedicationEntrySchema.parse(entry)).toEqual(entry);
  });

  it('rejects DecodedPrescription with simulated=false', () => {
    const bad = {
      medications: [],
      alternativesByMedicationId: {},
      simulated: false,
      warnings: [],
    };
    expect(() => DecodedPrescriptionSchema.parse(bad)).toThrow();
  });

  it('round-trips each PipelineEvent variant', () => {
    const samples = [
      { type: 'stage_start', stage: 'preprocessor', at: 1 },
      { type: 'stage_complete', stage: 'ocr-reader', at: 2, durationMs: 100 },
      {
        type: 'pipeline_complete',
        result: {
          medications: [],
          alternativesByMedicationId: {},
          simulated: true,
          warnings: [],
        },
        totalDurationMs: 1000,
      },
      { type: 'pipeline_error', stage: null, message: 'boom' },
    ];
    for (const s of samples) {
      expect(PipelineEventSchema.parse(s)).toEqual(s);
    }
  });
});
