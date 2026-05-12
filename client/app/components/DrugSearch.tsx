'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DrugInfo, DrugMatch } from '@roshetta/shared/drug.js';
import { findCountry } from '@roshetta/shared/country.js';
import { searchDrugs, lookupDrug } from '@/lib/drugs';
import { useCountry } from './CountryContext';
import { Alert, ArrowRight, Pill, Shield, Sparkles, Swap, X } from '@/lib/icons';

// -----------------------------------------------------------------------------
// Small debounce hook — no external dep, lives close to its only caller.
// -----------------------------------------------------------------------------
function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// -----------------------------------------------------------------------------
// Search section component. Two modes:
//   - standalone (default): wraps in <section> + .card — its own page block
//   - embedded            : just the form + detail, fits inside another card
// -----------------------------------------------------------------------------
export interface DrugSearchProps {
  embedded?: boolean;
}

export function DrugSearch({ embedded = false }: DrugSearchProps = {}) {
  const { country } = useCountry();
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<DrugMatch[]>([]);
  const [info, setInfo] = useState<DrugInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounced = useDebounced(query, 240);
  const containerRef = useRef<HTMLFormElement | null>(null);

  // Live search.
  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed.length < 1) {
      setMatches([]);
      return;
    }
    const ac = new AbortController();
    setIsSearching(true);
    searchDrugs(trimmed, country.code, ac.signal)
      .then((res) => {
        setMatches(res.matches);
        setOpen(res.matches.length > 0);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') console.warn(err);
      })
      .finally(() => setIsSearching(false));
    return () => ac.abort();
  }, [debounced, country.code]);

  // Close dropdown on outside click / Esc.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const runLookup = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setOpen(false);
    setIsLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await lookupDrug(name, country.code);
      setInfo(res.info);
      setQuery(res.info.canonicalName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setIsLoading(false);
    }
  }, [country.code]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const pick = matches[0];
    runLookup(pick?.canonicalName ?? query);
  }, [matches, query, runLookup]);

  const handleClear = useCallback(() => {
    setQuery('');
    setMatches([]);
    setInfo(null);
    setError(null);
  }, []);

  const showHint = !info && !isLoading && !error && query.trim().length === 0;

  // The form + suggestions + detail card. Shared between standalone and
  // embedded renderings.
  const body = (
    <>
        <form className="drug-search__form" onSubmit={handleSubmit} ref={containerRef}>
          <div className="drug-search__input-wrap">
            <Pill size={18} className="drug-search__input-icon" />
            <input
              type="text"
              className="drug-search__input"
              placeholder="e.g. Augmentin, Catafast, Multinerv, Concor…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => matches.length > 0 && setOpen(true)}
              aria-label="Medicine name"
              autoComplete="off"
              spellCheck="false"
            />
            {query ? (
              <button
                type="button"
                className="drug-search__clear"
                onClick={handleClear}
                aria-label="Clear"
              >
                <X size={14} />
              </button>
            ) : null}
            {open && matches.length > 0 ? (
              <ul className="drug-search__menu" role="listbox" aria-label="Suggestions">
                {matches.map((m, idx) => (
                  <li key={`${m.canonicalName}-${idx}`} role="option" aria-selected="false">
                    <button
                      type="button"
                      className="drug-search__option"
                      onClick={() => runLookup(m.canonicalName)}
                    >
                      <span className="drug-search__option-name">{m.canonicalName}</span>
                      {m.activeIngredient ? (
                        <span className="drug-search__option-ingredient">
                          <Pill size={11} /> {m.activeIngredient}
                        </span>
                      ) : null}
                      {m.source === 'llm' ? (
                        <span className="drug-search__option-badge">
                          <Sparkles size={10} /> AI suggestion
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button type="submit" className="btn btn--primary btn--lg" disabled={isLoading || !query.trim()}>
            <span className="btn__copy">
              <span className="btn__main">{isLoading ? 'Searching…' : 'Find alternatives'}</span>
              <span className="btn__alt" lang="ar" dir="rtl">{isLoading ? 'جاري البحث…' : 'دوّر على البدائل'}</span>
            </span>
          </button>
        </form>

        {showHint ? (
          <p className="drug-search__hint">
            Tip: spelling doesn’t have to be perfect — “agumntn”, “catfast”, or “mobix” all work.
            <span className="drug-search__hint-ar" lang="ar" dir="rtl">
              مش لازم تكتبه صح — جرّب “أوجمنتن”، “كاتافست”، أو “موبيكس”.
            </span>
          </p>
        ) : null}

        {error ? (
          <div className="error-banner" role="alert" style={{ marginTop: 12 }}>
            <Alert className="error-banner__icon" />
            <div className="error-banner__body">
              <div><strong>Couldn’t look that up.</strong> {error}</div>
            </div>
          </div>
        ) : null}

        {info ? <DrugInfoCard info={info} /> : null}
    </>
  );

  if (embedded) {
    return <div className="drug-search drug-search--embedded">{body}</div>;
  }

  return (
    <section className="section drug-search">
      <div className="section__head">
        <h2 className="section__title">
          Find a medicine
          <span className="section__title-alt" lang="ar" dir="rtl">دوّر على دوا</span>
        </h2>
        <span className="section__hint">
          Type a name (even if misspelled) — we’ll suggest alternatives in {country.name}.
          <span className="section__hint-alt" lang="ar" dir="rtl">
            اكتب اسم الدوا (حتى لو غلط) وهنجيبلك البدائل في {country.nameAr}.
          </span>
        </span>
      </div>
      <div className="card card--featured">{body}</div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Drug detail card
// -----------------------------------------------------------------------------
function DrugInfoCard({ info }: { info: DrugInfo }) {
  const countryMeta = findCountry(info.country);
  return (
    <div className="drug-info" role="region" aria-label={`Details for ${info.canonicalName}`}>
      <header className="drug-info__head">
        <div>
          <h3 className="drug-info__name">{info.canonicalName}</h3>
          {info.activeIngredient ? (
            <p className="drug-info__ingredient">
              <Pill size={14} /> {info.activeIngredient}
              {info.strength ? <span className="drug-info__strength"> · {info.strength}</span> : null}
              {info.form ? <span className="drug-info__form"> · {info.form}</span> : null}
            </p>
          ) : null}
        </div>
        <span className={`drug-info__badge drug-info__badge--${info.source}`}>
          {info.source === 'local' ? 'verified' : info.source === 'merged' ? 'verified + AI' : 'AI'}
        </span>
      </header>

      {info.summary ? (
        <div className="drug-info__summary">
          <p>{info.summary}</p>
          {info.summaryAr ? <p lang="ar" dir="rtl">{info.summaryAr}</p> : null}
        </div>
      ) : null}

      {info.indication ? (
        <div className="drug-info__meta">
          <span className="drug-info__meta-label">Used for</span>
          <span className="drug-info__meta-label-ar" lang="ar" dir="rtl">دواعي الاستعمال</span>
          <span className="drug-info__meta-value" dir="auto">{info.indication}</span>
        </div>
      ) : null}

      {info.dosing ? (
        <div className="drug-info__meta">
          <span className="drug-info__meta-label">Typical dosing</span>
          <span className="drug-info__meta-label-ar" lang="ar" dir="rtl">الجرعة الموصى بها</span>
          <span className="drug-info__meta-value" dir="auto">{info.dosing}</span>
          {info.dosingAr ? (
            <span className="drug-info__meta-value drug-info__meta-value--ar" lang="ar" dir="rtl">
              {info.dosingAr}
            </span>
          ) : null}
        </div>
      ) : null}

      <BilingualBulletList
        title="Common side effects"
        titleAr="الآثار الجانبية الشائعة"
        items={info.sideEffects ?? []}
        itemsAr={info.sideEffectsAr ?? []}
        variant="info"
      />

      <BilingualBulletList
        title="Don't take if"
        titleAr="موانع الاستعمال"
        items={info.contraindications ?? []}
        itemsAr={info.contraindicationsAr ?? []}
        variant="warn"
      />

      {info.warnings.length > 0 ? (
        <div className="drug-info__warnings">
          <div className="drug-info__warnings-head">
            <Shield size={14} />
            <span>Worth knowing</span>
            <span lang="ar" dir="rtl">ملاحظات مهمة</span>
          </div>
          <ul>
            {info.warnings.map((w, i) => (
              <li key={i} dir="auto">{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="drug-info__alts-head">
        <h4>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden>{countryMeta.flag}</span>
            Alternatives in {countryMeta.name}
          </span>
          <span lang="ar" dir="rtl">البدائل في {countryMeta.nameAr}</span>
        </h4>
        <span className="country-pill" style={{ marginInlineStart: 'auto' }}>
          <Swap size={12} /> {info.alternatives.length}
        </span>
      </div>

      {info.alternatives.length === 0 ? (
        <p className="drug-info__empty" dir="auto">
          We don’t have a curated alternative for this market yet. Ask your pharmacist.
        </p>
      ) : (
        <ul className="drug-info__alts">
          {info.alternatives.map((alt, idx) => (
            <li key={`${alt.brandName}-${idx}`} className="alt-card">
              <div className="alt-card__head">
                <div>
                  <div className="alt-card__brand">{alt.brandName}</div>
                  <div className="alt-card__meta">
                    {alt.activeIngredient ? <span className="alt-card__pill alt-card__pill--ingredient">{alt.activeIngredient}</span> : null}
                    {alt.strength ? <span className="alt-card__pill">{alt.strength}</span> : null}
                    {alt.form ? <span className="alt-card__pill">{alt.form}</span> : null}
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--blue-600)', flexShrink: 0 }} />
              </div>
              {alt.reason ? <div className="alt-card__reason" dir="auto">{alt.reason}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// BilingualBulletList — used for "side effects" + "don't take if" sections.
// Renders English first, with a tiny Arabic mirror line beside each bullet.
// -----------------------------------------------------------------------------
export interface BilingualBulletListProps {
  title: string;
  titleAr: string;
  items: readonly string[];
  itemsAr: readonly string[];
  /** info: blue accents · warn: cream/amber accents */
  variant: 'info' | 'warn';
}

export function BilingualBulletList({ title, titleAr, items, itemsAr, variant }: BilingualBulletListProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`bullet-list bullet-list--${variant}`}>
      <div className="bullet-list__head">
        <span>{title}</span>
        <span lang="ar" dir="rtl">{titleAr}</span>
      </div>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            <span dir="auto">{item}</span>
            {itemsAr[i] ? <span className="bullet-list__ar" lang="ar" dir="rtl">{itemsAr[i]}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
