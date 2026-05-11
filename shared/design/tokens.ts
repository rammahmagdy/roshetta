// =========================================================================
// Roshetta Design System — typed tokens
// =========================================================================
// Mirror of tokens.css for any TS/JS code that needs the values at runtime
// (charts, canvas, inline styles, JS animations).

export const color = {
  ink: '#0f172a',
  ink2: '#1e293b',
  ink3: '#475569',
  inkDim: '#64748b',
  inkFaint: '#94a3b8',
  inkGhost: '#cbd5e1',

  bg: '#ffffff',
  bg2: '#f1f5f9',
  surface: '#ffffff',
  surface2: '#f8fafc',
  surface3: '#f1f5f9',
  line: '#e2e8f0',
  line2: '#cbd5e1',

  green: '#10b981',
  green500: '#34d399',
  green600: '#059669',
  green700: '#047857',
  green50: '#ecfdf5',
  green100: '#d1fae5',
  green200: '#a7f3d0',

  blue: '#3b82f6',
  blue400: '#60a5fa',
  blue500: '#38bdf8',
  blue600: '#2563eb',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',

  warn: '#a16207',
  warnSoftBg: '#fef9e7',
  warnSoftBorder: '#f0e3b3',
  warnSoftInk: '#6b5316',

  error: '#b91c1c',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  errorInk: '#991b1b',
} as const;

export const spacing = {
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20,
  s6: 24, s8: 32, s10: 40, s12: 48, s16: 64,
  s20: 80, s24: 96,
} as const;

export const radius = {
  xs: 4, sm: 6, md: 10, lg: 14, xl: 20, '2xl': 28, pill: 999,
} as const;

export const motion = {
  ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  tFast: 140,
  tBase: 240,
  tSlow: 400,
  tSlower: 700,
} as const;

export const shadow = {
  xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
  sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
  md: '0 8px 24px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04)',
  lg: '0 24px 48px rgba(15, 23, 42, 0.08), 0 8px 16px rgba(15, 23, 42, 0.05)',
} as const;

export const font = {
  sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  arabic: '"IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif',
} as const;

export const tokens = { color, spacing, radius, motion, shadow, font } as const;
export type Tokens = typeof tokens;
