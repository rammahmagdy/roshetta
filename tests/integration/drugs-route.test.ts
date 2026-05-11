import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/src/app.js';

// These tests deliberately don't set OPENROUTER_API_KEY, so the LLM branch
// is never called and we exercise the pure-local cascade.

const ORIGINAL_KEY = process.env.OPENROUTER_API_KEY;

beforeEach(() => { delete process.env.OPENROUTER_API_KEY; });
afterEach(() => {
  if (ORIGINAL_KEY) process.env.OPENROUTER_API_KEY = ORIGINAL_KEY;
});

describe('GET /api/drugs/search', () => {
  it('returns local fuzzy matches for a misspelled brand', async () => {
    const app = createApp();
    const res = await request(app)
      .get('/api/drugs/search')
      .query({ q: 'augmntin', country: 'EG' })
      .expect(200);
    expect(res.body.matches.length).toBeGreaterThan(0);
    const names = res.body.matches.map((m: { canonicalName: string }) => m.canonicalName.toLowerCase());
    expect(names).toContain('augmentin');
    expect(res.body.matches[0].source).toBe('local');
  });

  it('returns an empty payload for the empty query', async () => {
    const app = createApp();
    const res = await request(app).get('/api/drugs/search').query({ q: '' }).expect(200);
    expect(res.body.matches).toEqual([]);
  });
});

describe('POST /api/drugs/lookup', () => {
  it('returns local info + country alternatives for a known brand', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/drugs/lookup')
      .send({ name: 'Augmentin', country: 'EG' })
      .expect(200);
    expect(res.body.info.canonicalName).toBe('Augmentin');
    expect(res.body.info.activeIngredient).toMatch(/Amoxicillin/i);
    expect(res.body.info.country).toBe('EG');
    expect(Array.isArray(res.body.info.alternatives)).toBe(true);
  });

  it('rejects an empty name with 400', async () => {
    const app = createApp();
    await request(app).post('/api/drugs/lookup').send({ name: '' }).expect(400);
  });

  it('falls back gracefully when the brand is unknown and no LLM is set', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/drugs/lookup')
      .send({ name: 'TotallyMadeUpDrug', country: 'EG' })
      .expect(200);
    expect(res.body.info.canonicalName).toBe('TotallyMadeUpDrug');
    expect(res.body.info.source).toBe('local');
  });
});
