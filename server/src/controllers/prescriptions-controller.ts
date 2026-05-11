import type { Request, Response } from 'express';
import type { PipelineEvent } from '@roshetta/shared/events.js';
import { type CountryCode, findCountry } from '@roshetta/shared/country.js';
import { runPipeline } from '../pipeline/pipeline.js';
import { detectCountryFromRequest } from '../middleware/geo.js';

function writeSseEvent(res: Response, event: PipelineEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function resolveCountry(req: Request): CountryCode {
  // Priority: explicit X-Country header / ?country= → IP geo header → default.
  const explicit =
    (req.header('x-country') || '').trim() ||
    (typeof req.query.country === 'string' ? req.query.country : '');
  if (explicit) return findCountry(explicit).code;
  return detectCountryFromRequest(req);
}

export async function postPrescription(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No image file was uploaded. Use the "image" form field.' });
    return;
  }

  const file = req.file;
  const country = resolveCountry(req);

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-Roshetta-Country', country);
  res.flushHeaders();

  try {
    await runPipeline(
      { image: file.buffer, mimeType: file.mimetype, country },
      (event) => writeSseEvent(res, event),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown pipeline failure.';
    writeSseEvent(res, { type: 'pipeline_error', stage: null, message });
  } finally {
    res.end();
  }
}

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    uptimeSec: Math.round(process.uptime()),
  });
}

export function getGeo(req: Request, res: Response): void {
  const country = detectCountryFromRequest(req);
  res.status(200).json({
    country,
    name: findCountry(country).name,
    flag: findCountry(country).flag,
  });
}
