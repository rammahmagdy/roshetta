import type { DecodedPrescription, MedicationEntry, TherapeuticAlternative } from './prescription.js';

export type StageName = 'preprocessor' | 'ocr-reader' | 'nlp-parser' | 'alternatives-finder';

export const STAGE_ORDER: readonly StageName[] = [
  'preprocessor',
  'ocr-reader',
  'nlp-parser',
  'alternatives-finder',
] as const;

// --- Stage I/O contracts. These are the boundary that a real-provider integration
// --- (GPT-4o, Claude Vision, Gemini, etc.) would touch. Replace one stage's
// --- implementation; nothing else needs to change.

export interface PreprocessorInput {
  image: Buffer;
  mimeType: string;
}

export interface PreprocessorOutput {
  processedImage: Buffer;
  width: number;
  height: number;
  channels: number;
  format: string;
}

export interface OcrInput {
  processedImage: Buffer;
  width: number;
  height: number;
}

export interface OcrOutput {
  rawText: string;
  detectedLines: number;
}

export interface NlpInput {
  rawText: string;
}

export interface NlpOutput {
  medications: MedicationEntry[];
  warnings: string[];
}

export interface AlternativesInput {
  medications: MedicationEntry[];
}

export interface AlternativesOutput {
  alternativesByMedicationId: Record<string, TherapeuticAlternative[]>;
}

export interface PipelineFinalOutput {
  result: DecodedPrescription;
}
