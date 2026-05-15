import { createHash } from 'node:crypto';
import type { OcrInput, OcrOutput } from '@roshetta/shared/pipeline.js';
import { OCR_SAMPLES } from './data/ocr-samples.js';
import { runVisionCascade } from './providers/index.js';
import { chandraMode, isChandraEnabled, runChandraOcr } from './providers/chandra.js';

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 1800;

function pickSampleIndex(image: Buffer): number {
  const hash = createHash('sha1').update(image).digest();
  return hash[0]! % OCR_SAMPLES.length;
}

function simulatedDelayMs(image: Buffer): number {
  const hash = createHash('sha1').update(image).digest();
  const range = MAX_DELAY_MS - MIN_DELAY_MS;
  return MIN_DELAY_MS + (hash[1]! % range);
}

function mockOcr(input: OcrInput): OcrOutput {
  const idx = pickSampleIndex(input.processedImage);
  const rawText = OCR_SAMPLES[idx]!;
  const detectedLines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
  return { rawText, detectedLines };
}

// SMART OCR ENTRY POINT.
//
// - If any vision provider (Anthropic / OpenAI / Google) is configured via
//   environment variable, the cascade runs through them in order and returns
//   the first success.
// - If none are configured, OR all fail, we fall back to the bundled mock
//   samples so the demo keeps working offline.
//
// To enable real OCR, set ANY of:
//   - ANTHROPIC_API_KEY  (recommended first; Claude reads MENA handwriting well)
//   - OPENAI_API_KEY
//   - GEMINI_API_KEY / GOOGLE_API_KEY
// Optional overrides:
//   - VISION_PROVIDER_ORDER=anthropic,openai,google
//   - ANTHROPIC_MODEL / OPENAI_MODEL / GEMINI_MODEL
export async function runOcrReader(input: OcrInput): Promise<OcrOutput> {
  const mode = chandraMode();
  if (isChandraEnabled()) {
    try {
      const chandra = await runChandraOcr(input.processedImage);
      if (chandra) return chandra;
      console.warn('[ocr] Chandra OCR returned no usable output');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (mode === 'only') throw new Error(`Chandra OCR failed: ${msg}`);
      console.warn(`[ocr] Chandra OCR failed, falling back to vision cascade: ${msg}`);
    }
  }

  if (mode === 'only') {
    throw new Error('CHANDRA_OCR_MODE=only requires CHANDRA_OCR_URL and a successful Chandra response.');
  }

  // Real vision providers (if configured). Preferred path: provider returns
  // STRUCTURED medications which skip the regex parser entirely.
  const cascade = await runVisionCascade({
    image: input.processedImage,
    promptHints: { country: 'EG', languages: ['ar', 'en'] },
  });
  if (cascade) {
    return {
      rawText: cascade.rawText,
      detectedLines: cascade.detectedLines,
      structuredMedications: cascade.medications,
      warnings: cascade.warnings,
    };
  }

  // Fall back to the deterministic mock pipeline.
  await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(input.processedImage)));
  return mockOcr(input);
}
