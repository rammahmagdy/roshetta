import { createHash } from 'node:crypto';
import type { OcrInput, OcrOutput } from '@roshetta/shared/pipeline.js';
import { OCR_SAMPLES } from './data/ocr-samples.js';
import { runVisionCascade } from './providers/index.js';

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
  // Real vision providers (if configured).
  const cascade = await runVisionCascade({
    image: input.processedImage,
    promptHints: { country: 'EG', languages: ['ar', 'en'] },
  });
  if (cascade) {
    return { rawText: cascade.rawText, detectedLines: cascade.detectedLines };
  }

  // Fall back to the deterministic mock pipeline.
  await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(input.processedImage)));
  return mockOcr(input);
}
