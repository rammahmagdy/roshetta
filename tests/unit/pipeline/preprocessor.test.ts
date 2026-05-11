import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { runPreprocessor } from '../../../server/src/pipeline/preprocessor.js';

const FIXTURE = resolve(__dirname, '../../fixtures/prescription-clear.png');

describe('preprocessor', () => {
  it('returns a grayscale image at or below the max width', async () => {
    const buf = await readFile(FIXTURE);
    const out = await runPreprocessor({ image: buf, mimeType: 'image/png' });
    expect(out.processedImage.byteLength).toBeGreaterThan(0);
    expect(out.format).toBe('png');
    expect(out.width).toBeLessThanOrEqual(1600);

    // Grayscale check: even when sharp emits a 3/4-channel PNG, after .grayscale()
    // the R, G, and B channel means should be effectively identical per pixel.
    const stats = await sharp(out.processedImage).stats();
    if (stats.channels.length >= 3) {
      const [r, g, b] = stats.channels;
      expect(Math.abs(r!.mean - g!.mean)).toBeLessThan(0.5);
      expect(Math.abs(g!.mean - b!.mean)).toBeLessThan(0.5);
    }
  });

  it('shrinks an oversized image down to the max width', async () => {
    // Build a 3000-wide white PNG so we exercise the resize branch.
    const big = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();
    const out = await runPreprocessor({ image: big, mimeType: 'image/png' });
    expect(out.width).toBe(1600);
  });
});
