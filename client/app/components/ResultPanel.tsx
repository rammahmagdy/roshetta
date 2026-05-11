import type { DecodedPrescription } from '@roshetta/shared/prescription.js';
import type { Country } from '@roshetta/shared/country.js';
import { MedicationCard } from './MedicationCard';
import { Shield, Alert } from '@/lib/icons';

interface ResultPanelProps {
  result: DecodedPrescription;
  country: Country;
  onOpenAlternatives: (medicationId: string) => void;
  onReset: () => void;
}

export function ResultPanel({ result, country, onOpenAlternatives, onReset }: ResultPanelProps) {
  return (
    <section className="section">
      <div className="section__head">
        <div>
          <h2 className="section__title">
            Your medications
            <span className="section__title-alt" lang="ar" dir="rtl">أدويتك</span>
          </h2>
          <div style={{ marginTop: 8 }}>
            <span className="country-pill" title="Alternatives are filtered for this country">
              <span className="country-pill__flag" aria-hidden>{country.flag}</span>
              Alternatives for {country.name}
              <span className="country-pill__ar" lang="ar" dir="rtl">· بدائل {country.nameAr}</span>
            </span>
          </div>
        </div>
        <button className="btn btn--ghost" onClick={onReset}>
          <span className="btn__copy">
            <span className="btn__main">Read another</span>
            <span className="btn__alt" lang="ar" dir="rtl">روشتة تانية</span>
          </span>
        </button>
      </div>

      <div className="medical-callout" role="note">
        <Shield className="medical-callout__icon" />
        <div className="medical-callout__body">
          <p>
            <strong>Not a prescription.</strong> Always confirm with your doctor or pharmacist
            before taking anything.
          </p>
          <p lang="ar" dir="rtl">
            <strong>دي مش روشتة طبية رسمية.</strong>
            {' '}استشر طبيبك أو الصيدلي قبل أي قرار علاجي.
          </p>
        </div>
      </div>

      {result.warnings.length > 0
        ? result.warnings.map((w, i) => (
            <div key={i} className="warn-banner">
              <Alert className="warn-banner__icon" />
              <div>{w}</div>
            </div>
          ))
        : null}

      {result.medications.length === 0 ? (
        <div className="card">
          <div className="empty-alts">
            <Alert size={28} className="empty-alts__icon" />
            <div>
              <strong>Nothing detected.</strong>
              <div style={{ marginTop: 6, fontSize: 13 }}>
                Try a sharper, well-lit photo cropped tightly to the writing.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="med-grid stagger">
          {result.medications.map((med) => (
            <MedicationCard
              key={med.id}
              med={med}
              alternativeCount={result.alternativesByMedicationId[med.id]?.length ?? 0}
              onClick={() => onOpenAlternatives(med.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
