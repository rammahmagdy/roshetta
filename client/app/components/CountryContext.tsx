'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { COUNTRIES, type CountryCode, DEFAULT_COUNTRY, findCountry, type Country } from '@roshetta/shared/country.js';
import { fetchServerCountry, guessCountryFromTimezone, loadStoredCountry, storeCountry } from '@/lib/country';

interface CountryContextValue {
  country: Country;
  countryCode: CountryCode;
  source: 'default' | 'timezone' | 'ip' | 'manual';
  setCountry: (code: CountryCode) => void;
  all: readonly Country[];
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [source, setSource] = useState<CountryContextValue['source']>('default');

  // Resolution order: stored manual pick → IP (server) → browser timezone → default.
  useEffect(() => {
    const stored = loadStoredCountry();
    if (stored) {
      setCode(stored);
      setSource('manual');
      return;
    }

    const tzGuess = guessCountryFromTimezone();
    if (tzGuess !== DEFAULT_COUNTRY) {
      setCode(tzGuess);
      setSource('timezone');
    }

    // Try server IP geo on the side; it overrides timezone if it returns something.
    const ac = new AbortController();
    fetchServerCountry(ac.signal).then((server) => {
      if (server) {
        setCode((current) => {
          // Only overwrite a timezone/default guess — never a manual pick.
          if (loadStoredCountry()) return current;
          return server;
        });
        setSource((s) => (s === 'manual' ? s : 'ip'));
      }
    });
    return () => ac.abort();
  }, []);

  const setCountry = useCallback((next: CountryCode) => {
    setCode(next);
    setSource('manual');
    storeCountry(next);
  }, []);

  const value = useMemo<CountryContextValue>(() => ({
    country: findCountry(code),
    countryCode: code,
    source,
    setCountry,
    all: COUNTRIES,
  }), [code, source, setCountry]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used inside <CountryProvider>');
  return ctx;
}
