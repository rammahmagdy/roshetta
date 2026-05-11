import type { PipelineEvent } from '@roshetta/shared/events.js';
import type { StageName } from '@roshetta/shared/pipeline.js';
import type { DecodedPrescription } from '@roshetta/shared/prescription.js';
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

  const nlp = await runStage('nlp-parser', () =>
    runNlpParser({ rawText: ocr.rawText }), onEvent);

  const alternatives = await runStage('alternatives-finder', () =>
    runAlternativesFinder({
      medications: nlp.medications,
      country: input.country ?? DEFAULT_COUNTRY,
    }), onEvent);

  const totalDurationMs = Date.now() - overallStart;
  const result: DecodedPrescription = {
    medications: nlp.medications,
    alternativesByMedicationId: alternatives.alternativesByMedicationId,
    simulated: true,
    warnings: nlp.warnings,
  };

  onEvent({ type: 'pipeline_complete', result, totalDurationMs });

  return { result, totalDurationMs };
}
