import { randomUUID } from 'node:crypto';
import type { PipelineEvent } from '@roshetta/shared/events.js';
import type { StageName } from '@roshetta/shared/pipeline.js';
import type { DecodedPrescription, MedicationEntry } from '@roshetta/shared/prescription.js';
import { type CountryCode, DEFAULT_COUNTRY } from '@roshetta/shared/country.js';
import { runPreprocessor } from './preprocessor.js';
import { runOcrReader } from './ocr-reader.js';
import { runNlpParser } from './nlp-parser.js';
import { runAlternativesFinder } from './alternatives-finder.js';

export interface PipelineRunInput {
  image: Buffer;
  mimeType: string;
  country?: CountryCode;
}

export type ProgressCallback = (event: PipelineEvent) => void;

export interface PipelineRunResult {
  result: DecodedPrescription;
  totalDurationMs: number;
}

async function runStage<T>(
  stage: StageName,
  fn: () => Promise<T>,
  onEvent: ProgressCallback,
): Promise<T> {
  const startedAt = Date.now();
  onEvent({ type: 'stage_start', stage, at: startedAt });
  try {
    const out = await fn();
    const finishedAt = Date.now();
    onEvent({
      type: 'stage_complete',
      stage,
      at: finishedAt,
      durationMs: finishedAt - startedAt,
    });
    return out;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onEvent({ type: 'pipeline_error', stage, message });
    throw err;
  }
}

export async function runPipeline(
  input: PipelineRunInput,
  onEvent: ProgressCallback,
): Promise<PipelineRunResult> {
  const overallStart = Date.now();

  const preprocessed = await runStage('preprocessor', () =>
    runPreprocessor({ image: input.image, mimeType: input.mimeType }), onEvent);

  const ocr = await runStage('ocr-reader', () =>
    runOcrReader({
      processedImage: preprocessed.processedImage,
      width: preprocessed.width,
      height: preprocessed.height,
    }), onEvent);

  // NLP stage. Two paths:
  //  1. The vision provider returned STRUCTURED medications → assign IDs
  //     and hand them straight to the alternatives finder. Skip the regex
  //     parser entirely (it's only useful for mock-text fallback).
  //  2. Otherwise → run the legacy regex parser over the raw text.
  let nlpMedications: MedicationEntry[];
  let nlpWarnings: string[];

  if (ocr.structuredMedications && ocr.structuredMedications.length > 0) {
    nlpMedications = await runStage('nlp-parser', async () => {
      // Tiny pause so the UI's stepper feels natural and the user sees the
      // stage transition. The LLM did the parsing work already.
      await new Promise((r) => setTimeout(r, 300));
      return ocr.structuredMedications!.map((m) => ({
        id: randomUUID(),
        rawName: m.rawName,
        canonicalName: m.canonicalName,
        activeIngredient: m.activeIngredient,
        strength: m.strength,
        form: m.form,
        frequency: m.frequency,
        duration: m.duration,
        indication: m.indication,
        confidence: m.confidence,
      }));
    }, onEvent);
    nlpWarnings = ocr.warnings ?? [];
  } else {
    const nlp = await runStage('nlp-parser', () =>
      runNlpParser({ rawText: ocr.rawText }), onEvent);
    nlpMedications = nlp.medications;
    nlpWarnings = nlp.warnings;
  }

  const alternatives = await runStage('alternatives-finder', () =>
    runAlternativesFinder({
      medications: nlpMedications,
      country: input.country ?? DEFAULT_COUNTRY,
    }), onEvent);

  const totalDurationMs = Date.now() - overallStart;
  const result: DecodedPrescription = {
    medications: nlpMedications,
    alternativesByMedicationId: alternatives.alternativesByMedicationId,
    simulated: true,
    warnings: nlpWarnings,
  };

  onEvent({ type: 'pipeline_complete', result, totalDurationMs });

  return { result, totalDurationMs };
}
