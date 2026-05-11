import type { Metadata } from 'next';
import { Shield } from '@/lib/icons';

export const metadata: Metadata = {
  title: 'Contact — Roshetta',
  description: 'Get in touch with the Roshetta team.',
};

export default function ContactPage() {
  return (
    <main>
      <header className="hero">
        <h1 className="hero__title">
          Get in <em>touch</em>.
        </h1>
        <h2 className="hero__title-ar" lang="ar" dir="rtl">
          <em>اتواصل</em> معانا.
        </h2>
        <p className="hero__sub" style={{ whiteSpace: 'normal', maxWidth: '60ch' }}>
          Questions, feedback, or a partnership idea? Send us a note — we read every one.
        </p>
        <p className="hero__sub-ar" lang="ar" dir="rtl" style={{ maxWidth: '60ch' }}>
          عندك سؤال، اقتراح، أو فكرة شراكة؟ ابعتلنا — بنقرا كل الرسايل.
        </p>
      </header>

      <section className="section">
        <div className="contact-grid">
          <article className="card contact-card">
            <span className="contact-card__label">Email</span>
            <h2 className="contact-card__title">
              <a href="mailto:hello@roshetta.net">hello@roshetta.net</a>
            </h2>
            <p className="contact-card__sub">
              General questions, product feedback, or media.
            </p>
            <p className="contact-card__sub" lang="ar" dir="rtl">
              أسئلة عامة، آراء عن المنتج، أو إعلام.
            </p>
          </article>

          <article className="card contact-card">
            <span className="contact-card__label">Support</span>
            <h2 className="contact-card__title">
              <a href="mailto:support@roshetta.net">support@roshetta.net</a>
            </h2>
            <p className="contact-card__sub">
              Something not working? Tell us what you saw and on which device.
            </p>
            <p className="contact-card__sub" lang="ar" dir="rtl">
              فيه حاجة مش شغّالة؟ قولّنا حصل إيه ومن أي جهاز.
            </p>
          </article>

          <article className="card contact-card">
            <span className="contact-card__label">Partnerships</span>
            <h2 className="contact-card__title">
              <a href="mailto:partners@roshetta.net">partners@roshetta.net</a>
            </h2>
            <p className="contact-card__sub">
              Pharmacies, clinics, and health platforms — let’s talk.
            </p>
            <p className="contact-card__sub" lang="ar" dir="rtl">
              الصيدليات، العيادات، ومنصات الصحة — يلا نتكلم.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <h2 className="section__title">
            Send us a message
            <span className="section__title-alt" lang="ar" dir="rtl">ابعتلنا رسالة</span>
          </h2>
          <p style={{ color: 'var(--ink-dim)', fontSize: 13.5 }}>
            This MVP doesn’t persist messages — clicking send opens your email client.
          </p>
          <form
            className="contact-form"
            action="mailto:hello@roshetta.net"
            method="POST"
            encType="text/plain"
          >
            <label className="contact-field">
              <span className="contact-field__label">
                Your name
                <span className="contact-field__alt" lang="ar" dir="rtl">اسمك</span>
              </span>
              <input name="name" type="text" placeholder="Aya / Mahmoud / …" required />
            </label>
            <label className="contact-field">
              <span className="contact-field__label">
                Your email
                <span className="contact-field__alt" lang="ar" dir="rtl">إيميلك</span>
              </span>
              <input name="email" type="email" placeholder="name@example.com" required />
            </label>
            <label className="contact-field">
              <span className="contact-field__label">
                What can we help with?
                <span className="contact-field__alt" lang="ar" dir="rtl">عايز إيه؟</span>
              </span>
              <textarea name="message" rows={5} placeholder="Tell us a bit more…" required />
            </label>
            <div>
              <button type="submit" className="btn btn--primary btn--lg">
                <span className="btn__copy">
                  <span className="btn__main">Send message</span>
                  <span className="btn__alt" lang="ar" dir="rtl">ابعت الرسالة</span>
                </span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="medical-callout" role="note">
          <Shield className="medical-callout__icon" />
          <div className="medical-callout__body">
            <p>
              <strong>Please don’t send personal medical data.</strong> Use general descriptions
              only. For anything medical, talk to your doctor or pharmacist.
            </p>
            <p lang="ar" dir="rtl">
              <strong>متبعتلناش بيانات طبية شخصية.</strong>
              {' '}استخدم وصف عام بس. لأي حاجة طبية، استشر طبيبك أو الصيدلي.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
