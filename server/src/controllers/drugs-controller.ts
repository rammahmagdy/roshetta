import type { Request, Response } from 'express';
import { findCountry, type CountryCode } from '@roshetta/shared/country.js';
import { lookupDrug, searchDrugs } from '../drugs/service.js';
import { detectCountryFromRequest } from '../middleware/geo.js';

function resolveCountry(req: Request): CountryCode {
  const explicit =
    (req.header('x-country') || '').trim() ||
    (typeof req.query.country === 'string' ? req.query.country : '') ||
    (typeof req.body?.country === 'string' ? req.body.country : '');
  if (explicit) return findCountry(explicit).code;
  return detectCountryFromRequest(req);
}

export async function getDrugSearch(req: Request, res: Response): Promise<void> {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const country = resolveCountry(req);
  if (!q || q.trim().length < 1) {
    res.status(200).json({ query: '', exact: false, matches: [] });
    return;
  }
  try {
    const result = await searchDrugs(q, country);
    res.status(200).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed.';
    console.error('[drugs] search error:', err);
    res.status(500).json({ error: msg });
  }
}

export async function postDrugLookup(req: Request, res: Response): Promise<void> {
  const name = typeof req.body?.name === 'string' ? req.body.name : '';
  if (!name.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const country = resolveCountry(req);
  try {
    const result = await lookupDrug(name, country);
    res.status(200).json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lookup failed.';
    console.error('[drugs] lookup error:', err);
    res.status(500).json({ error: msg });
  }
}
