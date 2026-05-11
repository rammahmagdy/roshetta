'use client';

import { useEffect } from 'react';
import type { MedicationEntry, TherapeuticAlternative } from '@roshetta/shared/prescription.js';
import { Pill, Swap, X } from '@/lib/icons';

interface AlternativesDrawerProps {
  medication: MedicationEntry | null;
  alternatives: TherapeuticAlternative[];
  onClose: () => void;
}

export function AlternativesDrawer({ medication, alternatives, onClose }: AlternativesDrawerProps) {
  useEffect(() => {
    if (!medication) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [medication, onClose]);

  if (!medication) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true"
         aria-label={`Alternatives for ${medication.canonicalName}`}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__head">
          <div>
            <div className="drawer__title">
              {medication.canonicalName || medication.rawName}
              <span lang="ar" dir="rtl" style={{ display: 'block', fontFamily: 'var(--font-arabic)', fontSize: 13, fontWeight: 500, color: 'var(--ink-dim)', marginTop: 2 }}>
                البدائل المتاحة
              </span>
            </div>
            <div className="drawer__sub">
              <Pill size={12} /> {medication.activeIngredient || 'Active ingredient unknown'}
            </div>
          </div>
          <button className="drawer__close" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="drawer__body">
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
