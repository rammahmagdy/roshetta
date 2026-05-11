# Roshetta Design System

Single source of truth for the visual language of Roshetta.

## What's here

```
shared/design/
├── tokens.css   # CSS custom properties (color, type, spacing, radius, shadow, motion)
├── tokens.ts    # Same values, typed, for JS/TS consumers
└── README.md
```

## How to use

### From CSS (preferred for components)

The client's `app/globals.css` imports `tokens.css` and then uses the
variables freely:

```css
@import "@roshetta/shared/design/tokens.css";

.btn--primary {
  background: linear-gradient(135deg, var(--green-500), var(--green));
  color: #fff;
  padding: var(--s-3) var(--s-5);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-md);
  transition: transform var(--t-fast) var(--ease);
}
```

### From TypeScript

```ts
import { color, spacing } from "@roshetta/shared/design/tokens";

canvas.fillStyle = color.green;
canvas.font = `${spacing.s5}px ${font.sans}`;
```

## The palette

| Role | Token | Hex |
|------|------|-----|
| Primary | `--green` | `#10b981` |
| Primary hover | `--green-600` | `#059669` |
| Primary deep | `--green-700` | `#047857` |
| Primary tint | `--green-50` | `#ecfdf5` |
| Accent | `--blue` | `#3b82f6` |
| Accent hover | `--blue-600` | `#2563eb` |
| Accent tint | `--blue-50` | `#eff6ff` |
| Ink | `--ink` | `#0f172a` |
| Ink subtle | `--ink-dim` | `#64748b` |
| Surface | `--surface` | `#ffffff` |
| Hairline | `--line` | `#e2e8f0` |
| Soft warn (used only in disclaimer) | `--warn-soft-bg / -ink / -border` | cream/tan |

## Spacing scale

4-based: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
Available as `--s-1` through `--s-24`.

## Type

Two families, both loaded via `next/font/google` in `app/layout.tsx`:

- **Latin** — Inter, `--font-sans`.
- **Arabic** — IBM Plex Sans Arabic, `--font-arabic`.

Bilingual rule: when an English heading is bold, its Arabic mirror is bold.
When English is regular, Arabic is regular. The Arabic font reads visually
larger at the same point size, so Arabic mirrors are usually 1–3px smaller
than their English counterparts to keep the line feeling balanced.

## Motion

- `--t-fast: 140ms` — hover states, focus rings.
- `--t-base: 240ms` — card lifts, color changes.
- `--t-slow: 400ms` — drawer / modal entry, stage transitions.
- `--t-slower: 700ms` — progress fills.

All animations respect `prefers-reduced-motion`.

## Principles

1. **No black.** Use `--ink` (slate-900) for the darkest ink; never `#000`.
2. **Two accents, used with restraint.** Green for primary actions, blue
   for CTAs / links / state. Everything else stays neutral.
3. **Hairlines, not heavy borders.** `--line` (1px slate-200) is the
   default border.
4. **Soft shadows, layered.** Always combine two shadows
   (small contact + bigger ambient) — see `--shadow-md`.
5. **Generous spacing.** Inside cards use `--s-5` or `--s-6` padding;
   gaps between sections are `--s-10` or larger.
6. **One-line disclaimers only inside the output.** Use the cream
   `medical-callout` once, near the result list, never as a sticky banner.

## Extending

If you add a new token, update **both** `tokens.css` and `tokens.ts`,
then document it in the table above.
