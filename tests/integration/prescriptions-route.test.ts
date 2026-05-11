import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';
import type { PipelineEvent } from '../../shared/types/events.js';

const FIXTURE = resolve(__dirname, '../fixtures/prescription-clear.png');

function parseSseStream(text: string): PipelineEvent[] {
  const events: PipelineEvent[] = [];
  for (const block of text.split('\n\n')) {
    const dataLines = block
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim());
    if (dataLines.length === 0) continue;
    try {
      events.push(JSON.parse(dataLines.join('\n')) as PipelineEvent);
    } catch {
      // skip malformed
    }
  }
  return events;
}

describe('POST /api/prescriptions', () => {
  it('streams the full pipeline and a final pipeline_complete event', async () => {
    const app = createApp();
    const fixture = await readFile(FIXTURE);

    const res = await request(app)
      .post('/api/prescriptions')
      .attach('image', fixture, { filename: 'rx.png', contentType: 'image/png' })
      .expect(200)
      .expect('Content-Type', /text\/event-stream/);

    const events = parseSseStream(res.text);
    const types = events.map((e) => e.type);

    // We expect 4 stage_start + 4 stage_complete + 1 pipeline_complete = 9 events.
    expect(events.length).toBeGreaterThanOrEqual(9);
    expect(types.filter((t) => t === 'stage_start')).toHaveLength(4);
    expect(types.filter((t) => t === 'stage_complete')).toHaveLength(4);

    const final = events[events.length - 1];
    expect(final?.type).toBe('pipeline_complete');
    if (final?.type === 'pipeline_complete') {
      expect(final.result.simulated).toBe(true);
      expect(final.result.medications.length).toBeGreaterThanOrEqual(1);
      // At least one medication should have alternatives.
      const altCounts = Object.values(final.result.alternativesByMedicationId).map((a) => a.length);
      expect(Math.max(0, ...altCounts)).toBeGreaterThanOrEqual(1);
    }
  }, 15_000);

  it('rejects an unsupported file type with 400', async () => {
    const app = createApp();
    await request(app)
      .post('/api/prescriptions')
      .attach('image', Buffer.from('not an image'), { filename: 'a.txt', contentType: 'text/plain' })
      .expect(400);
  });

  it('rejects requests with no file', async () => {
    const app = createApp();
    await request(app).post('/api/prescriptions').expect(400);
  });
});

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});
