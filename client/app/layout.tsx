import type { ReactNode } from 'react';
import Link from 'next/link';
import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { LogoMark } from '@/lib/icons';
import { CountryProvider } from './components/CountryContext';
import { CountrySwitcher } from './components/CountrySwitcher';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
});

export const metadata = {
  title: 'Roshetta — read your prescription, find alternatives',
  description: 'Read your doctor’s handwritten prescription and find similar alternatives.',
};

// Force dynamic rendering at the root so Next never tries to prerender a
// synthetic /404 (which trips the "<Html> outside _document" bug in some
// 15.x Docker builds). All pages are still cacheable at the CDN layer.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${arabic.variable}`}>
      <body>
        <CountryProvider>
          <nav className="nav" aria-label="Roshetta">
            <div className="nav__inner">
              <Link href="/" className="nav__brand" aria-label="Roshetta home">
                <span className="nav__mark" aria-hidden>
                  <LogoMark size={18} />
                </span>
                <div>
                  <div className="nav__name">Roshetta</div>
                  <div className="nav__name-ar" lang="ar" dir="rtl">روشتة</div>
                </div>
              </Link>
              <div className="nav__right">
                <div className="nav__links">
                  <Link href="/about" className="nav__link">
                    <span className="nav__link-main">About</span>
                    <span className="nav__link-alt" lang="ar" dir="rtl">عن روشتة</span>
                  </Link>
                  <Link href="/contact" className="nav__link">
                    <span className="nav__link-main">Contact</span>
                    <span className="nav__link-alt" lang="ar" dir="rtl">تواصل</span>
                  </Link>
                </div>
                <CountrySwitcher />
              </div>
            </div>
          </nav>
          {children}
        </CountryProvider>
      </body>
    </html>
  );
}
