import type { Metadata } from 'next';
import { Pill, Swap, TextScan, Shield, Sparkles } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'About — Roshetta',
  description: 'What Roshetta does, how it works, and why we built it.',
};

export default function AboutPage() {
  return (
    <main>
      <header className="hero">
        <h1 className="hero__title">
          What is <em>Roshetta</em>?
        </h1>
        <h2 className="hero__title-ar" lang="ar" dir="rtl">
          إيه هي <em>روشتة</em>؟
        </h2>
        <p className="hero__sub" style={{ whiteSpace: 'normal', maxWidth: '64ch' }}>
          Roshetta reads a photo of your doctor’s prescription and tells you the medicines,
          doses, and alternatives that share the same active ingredient.
        </p>
        <p className="hero__sub-ar" lang="ar" dir="rtl" style={{ maxWidth: '64ch' }}>
          روشتة بتقرا صورة الروشتة بتاعتك وبتقولك الأدوية، الجرعات، والبدائل اللي بنفس
          المادة الفعّالة.
        </p>
      </header>

      <section className="section">
        <div className="card card--featured">
          <h2 className="section__title" style={{ marginBottom: 'var(--s-2)' }}>
            What it does
            <span className="section__title-alt" lang="ar" dir="rtl">بتعمل إيه؟</span>
          </h2>
          <div className="about-grid stagger">
            <div className="about-tile">
              <div className="about-tile__icon" aria-hidden><TextScan size={20} /></div>
              <h3 className="about-tile__title">
                Reads the writing
                <span lang="ar" dir="rtl">بتقرا الكتابة</span>
              </h3>
              <p>
                Even handwritten prescriptions on hospital letterheads with mixed Arabic and
                English notes.
              </p>
              <p lang="ar" dir="rtl">
                حتى الكتابة اليدوية للدكاترة، عربي وإنجليزي مع بعض.
              </p>
            </div>
            <div className="about-tile">
              <div className="about-tile__icon" aria-hidden><Pill size={20} /></div>
              <h3 className="about-tile__title">
                Identifies the medicine
                <span lang="ar" dir="rtl">بتحدد الدوا</span>
              </h3>
              <p>
                Pulls out the brand, dose, frequency, and duration so you can read it clearly.
              </p>
              <p lang="ar" dir="rtl">
                بتطلّع اسم الدوا، الجرعة، عدد المرات، والمدة بشكل واضح.
              </p>
            </div>
            <div className="about-tile">
              <div className="about-tile__icon" aria-hidden><Swap size={20} /></div>
              <h3 className="about-tile__title">
                Suggests alternatives
                <span lang="ar" dir="rtl">بترشّح البدائل</span>
              </h3>
              <p>
                Lists local brands that share the same active ingredient — useful for cost,
                availability, or supply gaps.
              </p>
              <p lang="ar" dir="rtl">
                بتعرض براندات محلية بنفس المادة الفعّالة — مفيدة للسعر والتوفر.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">
            How it works
            <span className="section__title-alt" lang="ar" dir="rtl">بتشتغل إزاي؟</span>
          </h2>
        </div>
        <ol className="about-steps">
          <li>
            <span className="about-steps__num">1</span>
            <div>
              <strong>Upload or snap a photo of the prescription.</strong>
              <span lang="ar" dir="rtl">ارفع أو صوّر الروشتة.</span>
            </div>
          </li>
          <li>
            <span className="about-steps__num">2</span>
            <div>
              <strong>We prepare the image and read the writing.</strong>
              <span lang="ar" dir="rtl">بنجهّز الصورة ونقرا الكتابة.</span>
            </div>
          </li>
          <li>
            <span className="about-steps__num">3</span>
            <div>
              <strong>We identify every medicine and list alternatives that share the active ingredient.</strong>
              <span lang="ar" dir="rtl">بنحدّد كل دوا ونعرض البدائل اللي بنفس المادة الفعّالة.</span>
            </div>
          </li>
          <li>
            <span className="about-steps__num">4</span>
            <div>
              <strong>You confirm everything with your doctor or pharmacist.</strong>
              <span lang="ar" dir="rtl">إنت بتأكد كل حاجة مع الدكتور أو الصيدلي.</span>
            </div>
          </li>
        </ol>
      </section>

      <section className="section">
        <div className="medical-callout" role="note">
          <Shield className="medical-callout__icon" />
          <div className="medical-callout__body">
            <p>
              <strong>Not a prescription.</strong> Roshetta is a helper, not a medical source.
              Always confirm with your doctor or pharmacist before acting on anything.
            </p>
            <p lang="ar" dir="rtl">
              <strong>روشتة مش مصدر طبي رسمي.</strong>
              {' '}هي أداة مساعدة بس — استشر طبيبك أو الصيدلي قبل أي قرار علاجي.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--green-700)', fontSize: 13, fontWeight: 600 }}>
            <Sparkles size={14} /> Built for MENA
          </div>
          <h2 className="section__title">
            Why we built it
            <span className="section__title-alt" lang="ar" dir="rtl">ليه عملناها؟</span>
          </h2>
          <p style={{ color: 'var(--ink-3)', maxWidth: '64ch' }}>
            Handwritten prescriptions are common in Egyptian and MENA clinics. They’re often
            hard to read, and patients rarely know which alternatives are available. Roshetta
            closes that gap with one photo.
          </p>
          <p lang="ar" dir="rtl" style={{ color: 'var(--ink-dim)', fontFamily: 'var(--font-arabic)', maxWidth: '64ch' }}>
            الروشتات اليدوية موجودة في كل العيادات في مصر والمنطقة، وبتبقى صعبة في القراءة،
            والمريض في الغالب مش عارف البدائل المتاحة. روشتة بتقفل الفجوة دي بصورة واحدة.
          </p>
        </div>
      </section>
    </main>
  );
}
