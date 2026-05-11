import { describe, expect, it } from 'vitest';
import { fuzzySearch, lookupLocalByName } from '../../../server/src/drugs/fuzzy.js';

describe('drugs/fuzzy.fuzzySearch', () => {
  it('returns the exact brand for a perfect-spelling query', () => {
    const out = fuzzySearch('Augmentin');
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]!.brand.canonicalName).toBe('Augmentin');
    expect(out[0]!.score).toBeGreaterThan(0.95);
  });

  it('tolerates a single-letter typo', () => {
    const out = fuzzySearch('Augmntin'); // missing "e"
    const names = out.map((r) => r.brand.canonicalName.toLowerCase());
    expect(names).toContain('augmentin');
  });

  it('tolerates a transposition', () => {
    const out = fuzzySearch('Agumentin'); // u↔g swap
    const names = out.map((r) => r.brand.canonicalName.toLowerCase());
    expect(names).toContain('augmentin');
  });

  it('treats common doctor shorthand as canonical', () => {
    const out = fuzzySearch('mobix');
    const names = out.map((r) => r.brand.canonicalName.toLowerCase());
    // Mobix is a KNOWN_BRANDS alias for Mobic; the indexed canonical may be either.
    expect(names.some((n) => n === 'mobic' || n === 'mobix')).toBe(true);
  });

  it('ranks prefix matches first', () => {
    const out = fuzzySearch('neur', { limit: 3 });
    expect(out[0]!.brand.canonicalName.toLowerCase().startsWith('neur')).toBe(true);
  });

  it('returns an empty array for the empty query', () => {
    expect(fuzzySearch('')).toEqual([]);
    expect(fuzzySearch('   ')).toEqual([]);
  });

  it('caps the number of results', () => {
    const out = fuzzySearch('a', { limit: 5, minScore: 0 });
    expect(out.length).toBeLessThanOrEqual(5);
  });
});

describe('drugs/fuzzy.lookupLocalByName', () => {
  it('finds a canonical brand by name (case-insensitive)', () => {
    expect(lookupLocalByName('augmentin')?.activeIngredient).toMatch(/Amoxicillin/i);
    expect(lookupLocalByName('AUGMENTIN')?.activeIngredient).toMatch(/Amoxicillin/i);
  });

  it('returns null for an unknown brand', () => {
    expect(lookupLocalByName('TotallyMadeUpDrug')).toBeNull();
  });
});
