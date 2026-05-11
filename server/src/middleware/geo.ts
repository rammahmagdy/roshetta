import type { Request } from 'express';
import { type CountryCode, DEFAULT_COUNTRY, findCountry } from '@roshetta/shared/country.js';

// Detect country code (ISO-3166 alpha-2) from request headers that proxies
// commonly inject:
//   - Cloudflare:   `CF-IPCountry`
//   - Vercel:        `x-vercel-ip-country`
//   - Railway/Fly:   `x-country` (some setups)
//   - Generic:       `x-geo-country`
//
// Falls back to DEFAULT_COUNTRY if no proxy header is present. For a richer
// fallback (no proxy), set GEO_PROVIDER=ipapi and the route can call out to
// https://ipapi.co/<ip>/country/ — disabled by default to avoid surprise
// network calls in a local dev environment.

export function detectCountryFromRequest(req: Request): CountryCode {
  const candidates = [
    req.header('cf-ipcountry'),
    req.header('x-vercel-ip-country'),
    req.header('x-country'),
    req.header('x-geo-country'),
  ];
  for (const c of candidates) {
    if (c && c.length === 2) return findCountry(c).code;
  }
  return DEFAULT_COUNTRY;
}
