import type { MedicationEntry } from '@roshetta/shared/prescription.js';
import { Pill, Swap, Alert, ArrowRight } from '@/lib/icons';

interface MedicationCardProps {
  med: MedicationEntry;
  alternativeCount: number;
  onClick: () => void;
}

export function MedicationCard({ med, alternativeCount, onClick }: MedicationCardProps) {
  const isUnknown = med.confidence === 'unrecognized';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`med-card${isUnknown ? ' is-unrecognized' : ''}`}
    >
      <div className="med-card__head">
        <div>
          <div className="med-card__name">
            {med.canonicalName || med.rawName || 'Unrecognized item'}
          </div>
          {med.activeIngredient ? (
            <div className="med-card__ingredient">
              <Pill size={14} /> {med.activeIngredient}
            </div>
          ) : null}
        </div>
        <span className={`confidence ${isUnknown ? 'confidence--warn' : 'confidence--ok'}`}>
          {isUnknown ? (
            <>
              <Alert size={12} /> verify
              <span className="confidence__alt" lang="ar" dir="rtl">تأكّد</span>
            </>
          ) : (
            <>
              parsed
              <span className="confidence__alt" lang="ar" dir="rtl">تم التعرف</span>
            </>
          )}
        </span>
      </div>

      {!isUnknown ? (
        <div className="med-grid__rows">
          <div>
            <div className="med-row__label">
              <span>Dose</span>
              <span className="med-row__label-ar" lang="ar" dir="rtl">الجرعة</span>
            </div>
            <div className="med-row__value">
              {med.strength || '—'}{med.form ? ` · ${med.form}` : ''}
            </div>
          </div>
          <div>
            <div className="med-row__label">
              <span>Frequency</span>
              <span className="med-row__label-ar" lang="ar" dir="rtl">مرات الاستعمال</span>
            </div>
            <div className="med-row__value" dir="auto">{med.frequency || '—'}</div>
          </div>
          <div>
            <div className="med-row__label">
              <span>Duration</span>
              <span className="med-row__label-ar" lang="ar" dir="rtl">المدة</span>
            </div>
            <div className="med-row__value" dir="auto">{med.duration || '—'}</div>
          </div>
          <div>
            <div className="med-row__label">
              <span>For</span>
              <span className="med-row__label-ar" lang="ar" dir="rtl">لعلاج</span>
            </div>
            <div className="med-row__value" dir="auto">{med.indication || '—'}</div>
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: 13,
          color: 'var(--ink-dim)',
          padding: 'var(--s-3)',
          background: 'var(--surface-2)',
          borderRadius: 'var(--r-md)',
          border: '1px dashed var(--line-2)',
        }}>
          <div>We couldn’t reliably read this one. Please confirm with your pharmacist.</div>
          <div lang="ar" dir="rtl" style={{ marginTop: 4, fontSize: 12.5, color: 'var(--ink-faint)' }}>
            مش قادرين نقراها بدقة — اتأكد مع الصيدلي.
          </div>
        </div>
      )}

      <div className="med-card__cta">
        <span className="med-card__cta-count">
          <Swap size={14} />
          {alternativeCount > 0 ? (
            <span>
              {alternativeCount} alternative{alternativeCount === 1 ? '' : 's'}
              <span lang="ar" dir="rtl" style={{ marginInlineStart: 6, fontFamily: 'var(--font-arabic)', fontWeight: 600, color: 'inherit' }}>
                · {alternativeCount === 1 ? 'بديل' : 'بدائل'}
              </span>
            </span>
          ) : (
            <span>
              Ask your pharmacist
              <span lang="ar" dir="rtl" style={{ marginInlineStart: 6, fontFamily: 'var(--font-arabic)', fontWeight: 600, color: 'inherit' }}>
                · اسأل الصيدلي
              </span>
            </span>
          )}
        </span>
        <span className="med-card__cta-arrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          View <ArrowRight size={14} />
        </span>
      </div>
    </button>
  );
}
