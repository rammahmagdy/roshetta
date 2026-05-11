// Shared country catalog. Used by the UI (switcher) and the server
// (alternatives filter). Extend cautiously — every code added here must
// also exist in the alternatives dataset or the lookup will return empty
// results for that country.

export type CountryCode = 'EG' | 'SA' | 'AE' | 'JO' | 'KW' | 'GLOBAL';

export interface Country {
  code: CountryCode;
  name: string;
  nameAr: string;
  flag: string;
  /** Phone calling-code style label, useful for the switcher button. */
  short: string;
}

export const COUNTRIES: readonly Country[] = [
  { code: 'EG',     name: 'Egypt',                nameAr: 'مصر',                  flag: '🇪🇬', short: 'EG' },
  { code: 'SA',     name: 'Saudi Arabia',         nameAr: 'السعودية',             flag: '🇸🇦', short: 'SA' },
  { code: 'AE',     name: 'United Arab Emirates', nameAr: 'الإمارات',             flag: '🇦🇪', short: 'AE' },
  { code: 'JO',     name: 'Jordan',               nameAr: 'الأردن',               flag: '🇯🇴', short: 'JO' },
  { code: 'KW',     name: 'Kuwait',               nameAr: 'الكويت',               flag: '🇰🇼', short: 'KW' },
  { code: 'GLOBAL', name: 'Other / Global',       nameAr: 'دولة أخرى',            flag: '🌐', short: 'INT' },
];

export const DEFAULT_COUNTRY: CountryCode = 'EG';

export function findCountry(code: string | null | undefined): Country {
  if (!code) return COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY)!;
  const upper = code.toUpperCase();
  return COUNTRIES.find((c) => c.code === upper) ?? COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY)!;
}
