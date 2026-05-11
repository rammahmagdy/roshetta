import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export function LogoMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
      <path d="M10.5 8.5h-1A1.5 1.5 0 0 0 8 10v1.5h2V10c0-.83-.67-1.5-1.5-1.5Z" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>
  );
}

export function UploadCloud({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.7-2A4 4 0 0 0 6 18" />
      <path d="M12 12v8" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  );
}

export function Camera({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M14.5 4h-5l-2 2.5H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3.5L14.5 4Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function Image({ size = 22, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m4 18 5-5 4 4 3-3 4 4" />
    </svg>
  );
}

export function TextScan({ size = 22, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2" />
      <path d="M7 9h10M7 12h10M7 15h6" />
    </svg>
  );
}

export function Pill({ size = 22, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-30 12 12)" />
      <path d="m8 8 8 8" />
    </svg>
  );
}

export function Swap({ size = 22, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m17 3 4 4-4 4" />
      <path d="M21 7H7a4 4 0 0 0-4 4" />
      <path d="m7 21-4-4 4-4" />
      <path d="M3 17h14a4 4 0 0 0 4-4" />
    </svg>
  );
}

export function Check({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m4 12 5 5L20 6" />
    </svg>
  );
}

export function Alert({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 3 1.5 21h21L12 3Z" />
      <path d="M12 10v5M12 18.5v.01" />
    </svg>
  );
}

export function Shield({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function X({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

export function ArrowRight({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Sparkles({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="m7 7 1.5 1.5M15.5 15.5 17 17M7 17l1.5-1.5M15.5 8.5 17 7" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Refresh({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function Lightbulb({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

export function HeroIllustration({ size = 240, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <defs>
        <linearGradient id="rxBg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6f1ee" />
        </linearGradient>
      </defs>
      {/* paper */}
      <rect
        x="48"
        y="36"
        width="120"
        height="160"
        rx="10"
        fill="url(#rxBg)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* paper fold tab */}
      <path d="M138 36v18a4 4 0 0 0 4 4h18" stroke="currentColor" strokeWidth="1.6" />
      {/* Rx symbol */}
      <text
        x="65"
        y="86"
        fontFamily="Georgia, serif"
        fontSize="34"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        ℞
      </text>
      {/* lines (handwriting-like) */}
      <path d="M64 110c8-2 18-2 28 1s24 1 32-2" />
      <path d="M64 124c10-3 22-2 34 0s22-1 28-3" />
      <path d="M64 138c14-2 28 1 38 0s14-3 22-3" />
      <path d="M64 152c8 0 16-1 22-3s14 0 22 0" />
      <path d="M64 166c10-2 22 1 32 1" />
      {/* pill */}
      <g transform="translate(146 124) rotate(35)">
        <rect x="-26" y="-12" width="56" height="24" rx="12" fill="#ffffff" stroke="currentColor" strokeWidth="1.6" />
        <line x1="2" y1="-12" x2="2" y2="12" stroke="currentColor" strokeWidth="1.6" />
      </g>
      {/* sparkle */}
      <g transform="translate(190 60)" stroke="currentColor" strokeWidth="1.6">
        <path d="M0 -10v6M0 4v6M-10 0h6M4 0h6" />
      </g>
    </svg>
  );
}
