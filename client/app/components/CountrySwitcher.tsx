'use client';

import { useEffect, useRef, useState } from 'react';
import { useCountry } from './CountryContext';

export function CountrySwitcher() {
  const { country, all, setCountry, source } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="country-switch" ref={ref}>
      <button
        type="button"
        className="country-switch__btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={source === 'manual' ? 'Manually picked' : source === 'ip' ? 'Detected from IP' : source === 'timezone' ? 'Detected from timezone' : 'Default'}
      >
        <span className="country-switch__flag" aria-hidden>{country.flag}</span>
        <span className="country-switch__copy">
          <span className="country-switch__name">{country.name}</span>
          <span className="country-switch__name-ar" lang="ar" dir="rtl">{country.nameAr}</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="country-switch__menu" role="listbox" aria-label="Choose your country">
          {all.map((c) => {
            const active = c.code === country.code;
            return (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={active}
                className={`country-switch__option${active ? ' is-active' : ''}`}
                onClick={() => { setCountry(c.code); setOpen(false); }}
              >
                <span className="country-switch__flag" aria-hidden>{c.flag}</span>
                <span className="country-switch__option-copy">
                  <span className="country-switch__option-name">{c.name}</span>
                  <span className="country-switch__option-name-ar" lang="ar" dir="rtl">{c.nameAr}</span>
                </span>
                {active ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m4 12 5 5L20 6" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
