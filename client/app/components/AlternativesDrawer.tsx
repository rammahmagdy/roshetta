'use client';

import { useEffect, useState } from 'react';
import type { MedicationEntry, TherapeuticAlternative } from '@roshetta/shared/prescription.js';
import type { DrugInfo } from '@roshetta/shared/drug.js';
import { Pill, Shield, Swap, X } from '@/lib/icons';
import { lookupDrug } from '@/lib/drugs';
import { useCountry } from './CountryContext';
import { BilingualBulletList } from './DrugSearch';

interface AlternativesDrawerProps {
  medication: MedicationEntry | null;
  alternatives: TherapeuticAlternative[];
  onClose: () => void;
}

export function AlternativesDrawer({ medication, alternatives, onClose }: AlternativesDrawerProps) {
  const { country } = useCountry();
  const [info, setInfo] = useState<DrugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Esc.
  useEffect(() => {
    if (!medication) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [medication, onClose]);

  // Fetch full drug info (summary, dosing, side effects, contraindications)
  // when the drawer opens for a recognized medication. Unrecognized items
  // skip the fetch because the LLM has nothing to work with.
  useEffect(() => {
    setInfo(null);
    setError(null);
    if (!medication) return;
    if (medication.confidence === 'unrecognized') return;
    const ac = new AbortController();
    setIsLoading(true);
    lookupDrug(medication.canonicalName || medication.rawName, country.code, ac.signal)
      .then((res) => setInfo(res.info))
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Could not load drug info.');
        }
      })
      .finally(() => setIsLoading(false));
    return () => ac.abort();
  }, [medication, country.code]);

  if (!medication) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true"
         aria-label={`Details for ${medication.canonicalName}`}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__head">
          <div>
            <div className="drawer__title">{medication.canonicalName || medication.rawName}</div>
            <div className="drawer__sub">
              <Pill size={12} /> {medication.activeIngredient || 'Active ingredient unknown'}
            </div>
          </div>
          <button className="drawer__close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="drawer__body">
          {/* ───────── About the drug ───────── */}
          <DrugDetailsSection
            info={info}
            isLoading={isLoading}
            error={error}
            unrecognized={medication.confidence === 'unrecognized'}
          />

          {/* ───────── Alternatives in user's country ───────── */}
          <div className="drug-info__alts-head drug-info__alts-head--in-drawer">
            <h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden>{country.flag}</span>
                Alternatives in {country.name}
              </span>
              <span lang="ar" dir="rtl">البدائل في {country.nameAr}</span>
            </h4>
          </div>

          {alternatives.length === 0 ? (
            <div className="empty-alts">
              <Swap size={32} className="empty-alts__icon" />
              <div>
                <strong>No alternatives found.</strong>
                <div style={{ marginTop: 6, fontSize: 13 }}>Ask your pharmacist for similar options.</div>
              </div>
            </div>
          ) : (
            alternatives.map((alt) => (
              <div key={alt.brandName} className="alt-card">
                <div className="alt-card__head">
                  <div>
                    <div className="alt-card__brand">{alt.brandName}</div>
                    <div className="alt-card__meta">
                      <span className="alt-card__pill alt-card__pill--ingredient">{alt.activeIngredient}</span>
                      <span className="alt-card__pill">{alt.strength}</span>
                      <span className="alt-card__pill">{alt.form}</span>
                    </div>
                  </div>
                </div>
                <div className="alt-card__reason">{alt.reason}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

// -----------------------------------------------------------------------------
// DrugDetailsSection — the "about the drug" block above alternatives.
// -----------------------------------------------------------------------------
interface DrugDetailsSectionProps {
  info: DrugInfo | null;
  isLoading: boolean;
  error: string | null;
  unrecognized: boolean;
}

function DrugDetailsSection({ info, isLoading, error, unrecognized }: DrugDetailsSectionProps) {
  if (unrecognized) {
    return (
      <div className="drug-info__empty" dir="auto">
        We couldn’t recognize this medicine, so there’s no info card.
        <span lang="ar" dir="rtl" style={{ display: 'block', marginTop: 4 }}>
          الدوا ده مش متعرف عليه — اتأكد من اسمه مع الصيدلي.
        </span>
      </div>
    );
  }
  if (isLoading) {
    return <DrugDetailsSkeleton />;
  }
  if (error && !info) {
    return <div className="drug-info__empty" dir="auto">{error}</div>;
  }
  if (!info) return null;

  return (
    <div className="drug-info drug-info--in-drawer">
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
    </div>
  );
}

function DrugDetailsSkeleton() {
  return (
    <div className="drug-skeleton" aria-busy="true" aria-label="Loading drug information">
      <div className="drug-skeleton__line drug-skeleton__line--lg" />
      <div className="drug-skeleton__line drug-skeleton__line--lg" style={{ width: '80%' }} />
      <div className="drug-skeleton__line" style={{ marginTop: 14 }} />
      <div className="drug-skeleton__line" style={{ width: '65%' }} />
      <div className="drug-skeleton__line" style={{ marginTop: 14, width: '40%' }} />
    </div>
  );
}
