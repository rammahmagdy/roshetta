import { z } from 'zod';

export const ParseConfidenceSchema = z.enum(['confident', 'unrecognized']);

export const MedicationEntrySchema = z.object({
  id: z.string().min(1),
  rawName: z.string(),
  canonicalName: z.string(),
  activeIngredient: z.string(),
  strength: z.string(),
  form: z.string(),
  frequency: z.string(),
  duration: z.string(),
  indication: z.string(),
  confidence: ParseConfidenceSchema,
});

export const TherapeuticAlternativeSchema = z.object({
  brandName: z.string().min(1),
  activeIngredient: z.string().min(1),
  strength: z.string(),
  form: z.string(),
  reason: z.string(),
});

export const DecodedPrescriptionSchema = z.object({
  medications: z.array(MedicationEntrySchema),
  alternativesByMedicationId: z.record(z.string(), z.array(TherapeuticAlternativeSchema)),
  simulated: z.literal(true),
  warnings: z.array(z.string()),
});

export const StageNameSchema = z.enum([
  'preprocessor',
  'ocr-reader',
  'nlp-parser',
  'alternatives-finder',
]);

export const PipelineEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stage_start'),
    stage: StageNameSchema,
    at: z.number(),
  }),
  z.object({
    type: z.literal('stage_complete'),
    stage: StageNameSchema,
    at: z.number(),
    durationMs: z.number(),
  }),
  z.object({
    type: z.literal('pipeline_complete'),
    result: DecodedPrescriptionSchema,
    totalDurationMs: z.number(),
  }),
  z.object({
    type: z.literal('pipeline_error'),
    stage: StageNameSchema.nullable(),
    message: z.string(),
  }),
]);
