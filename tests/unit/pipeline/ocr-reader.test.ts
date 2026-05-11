import { describe, expect, it } from 'vitest';
import { runOcrReader } from '../../../server/src/pipeline/ocr-reader.js';

describe('ocr-reader', () => {
  it('is deterministic for identical input', async () => {
    const buf = Buffer.from('identical bytes for both calls');
    const a = await runOcrReader({ processedImage: buf, width: 100, height: 100 });
    const b = await runOcrReader({ processedImage: buf, width: 100, height: 100 });
    expect(a.rawText).toBe(b.rawText);
    expect(a.rawText.length).toBeGreaterThan(20);
  });

  it('produces different OCR output for different input', async () => {
    // Run in parallel to keep the cumulative simulated delay bounded.
    const seeds = Array.from({ length: 8 }, (_, i) => Buffer.from(`seed-${i}`));
    const outputs = await Promise.all(
      seeds.map((buf) => runOcrReader({ processedImage: buf, width: 100, height: 100 })),
    );
    const seen = new Set(outputs.map((o) => o.rawText));
    // Should hit at least 2 of the 4 hand-written samples across 8 distinct seeds.
    expect(seen.size).toBeGreaterThanOrEqual(2);
  }, 10_000);

  it('reports a non-zero detected line count', async () => {
    const out = await runOcrReader({
      processedImage: Buffer.from('seed'),
      width: 10,
      height: 10,
    });
    expect(out.detectedLines).toBeGreaterThan(0);
  });
});
