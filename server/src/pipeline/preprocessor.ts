import sharp from 'sharp';
import type { PreprocessorInput, PreprocessorOutput } from '@roshetta/shared/pipeline.js';

const MAX_WIDTH = 1600;

// Real preprocessing — proves the swap-in boundary by running actual image work
// behind the same async function signature the mocked stages use.
export async function runPreprocessor(input: PreprocessorInput): Promise<PreprocessorOutput> {
  const pipeline = sharp(input.image).rotate(); // auto-rotate using EXIF

  const initialMeta = await pipeline.metadata();
  const needsResize = (initialMeta.width ?? 0) > MAX_WIDTH;

  let processed = pipeline;
  if (needsResize) {
    processed = processed.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  processed = processed.grayscale().normalize();

  const { data, info } = await processed.png().toBuffer({ resolveWithObject: true });

  return {
    processedImage: data,
    width: info.width,
    height: info.height,
    channels: info.channels,
    format: info.format,
  };
}
