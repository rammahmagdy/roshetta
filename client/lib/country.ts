import { type CountryCode, DEFAULT_COUNTRY, findCountry } from '@roshetta/shared/country.js';

const STORAGE_KEY = 'roshetta.country';

// Best-effort browser-side timezone → country guess. Falls back to DEFAULT.
// IP-based geolocation happens server-side on /api/geo (see server route).
const TZ_TO_COUNTRY: Record<string, CountryCode> = {
  'Africa/Cairo': 'EG',
  'Asia/Riyadh': 'SA',
  'Asia/Dubai': 'AE',
  'Asia/Amman': 'JO',
  'Asia/Kuwait': 'KW',
};

export function guessCountryFromTimezone(): CountryCode {
  if (typeof Intl === 'undefined') return DEFAULT_COUNTRY;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_TO_COUNTRY[tz] ?? DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

export function loadStoredCountry(): CountryCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v ? findCountry(v).code : null;
  } catch {
    return null;
  }
}

export function storeCountry(code: CountryCode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* ignore quota/privacy errors */
  }
}

export async function fetchServerCountry(signal?: AbortSignal): Promise<CountryCode | null> {
  try {
    const res = await fetch('/api/geo', { signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { country?: string | null };
    return body.country ? findCountry(body.country).code : null;
  } catch {
    return null;
  }
}
