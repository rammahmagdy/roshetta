import type { DrugLookupResponse, DrugSearchResponse } from '@roshetta/shared/drug.js';
import type { CountryCode } from '@roshetta/shared/country.js';

export async function searchDrugs(
  query: string,
  country: CountryCode,
  signal?: AbortSignal,
): Promise<DrugSearchResponse> {
  const url = `/api/drugs/search?q=${encodeURIComponent(query)}&country=${country}`;
  const res = await fetch(url, { signal, headers: { 'X-Country': country } });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return (await res.json()) as DrugSearchResponse;
}

export async function lookupDrug(
  name: string,
  country: CountryCode,
  signal?: AbortSignal,
): Promise<DrugLookupResponse> {
  const res = await fetch('/api/drugs/lookup', {
    method: 'POST',
    body: JSON.stringify({ name, country }),
    headers: { 'Content-Type': 'application/json', 'X-Country': country },
    signal,
  });
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
  return (await res.json()) as DrugLookupResponse;
}
