import Link from 'next/link';

// Force dynamic rendering so the synthetic /404 prerender in Next 15.5
// doesn't leak an <Html> import from the legacy Pages router fallback.
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <main>
      <header className="hero">
        <h1 className="hero__title">
          Page not <em>found</em>.
        </h1>
        <h2 className="hero__title-ar" lang="ar" dir="rtl">
          الصفحة <em>مش موجودة</em>.
        </h2>
        <p className="hero__sub" style={{ whiteSpace: 'normal', maxWidth: '60ch' }}>
          The page you’re looking for doesn’t exist. Head back home and try again.
        </p>
        <p className="hero__sub-ar" lang="ar" dir="rtl" style={{ maxWidth: '60ch' }}>
          الصفحة اللي بتدوّر عليها مش موجودة. ارجع للرئيسية وحاول تاني.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn--primary">
            <span className="btn__copy">
              <span className="btn__main">Back home</span>
              <span className="btn__alt" lang="ar" dir="rtl">العودة للرئيسية</span>
            </span>
          </Link>
          <Link href="/about" className="btn btn--ghost">
            <span className="btn__copy">
              <span className="btn__main">About Roshetta</span>
              <span className="btn__alt" lang="ar" dir="rtl">عن روشتة</span>
            </span>
          </Link>
        </div>
      </header>
    </main>
  );
}
