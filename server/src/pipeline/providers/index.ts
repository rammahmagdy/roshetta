import type { VisionProvider, VisionRequest, VisionResult } from './types.js';
import { anthropicVision } from './anthropic.js';
import { openaiVision } from './openai.js';
import { googleVision } from './google.js';
import { openrouterVision } from './openrouter.js';

// Provider preference. OpenRouter goes first because it gives access to all
// the major model families behind a single key — when configured, it's the
// most flexible option. Direct provider integrations are kept as backups
// in case the user prefers a direct key for one of them.
//
// Override with VISION_PROVIDER_ORDER (csv) if needed, e.g.
// `VISION_PROVIDER_ORDER=google,anthropic,openai`.
const DEFAULT_ORDER = ['openrouter', 'anthropic', 'openai', 'google'] as const;

const REGISTRY: Record<string, VisionProvider> = {
  openrouter: openrouterVision,
  anthropic: anthropicVision,
  openai: openaiVision,
  google: googleVision,
};

function orderedEnabled(): VisionProvider[] {
  const order = (process.env.VISION_PROVIDER_ORDER ?? DEFAULT_ORDER.join(','))
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is keyof typeof REGISTRY => p in REGISTRY);

  const seen = new Set<string>();
  const out: VisionProvider[] = [];
  for (const key of order) {
    if (seen.has(key)) continue;
    seen.add(key);
    const p = REGISTRY[key];
    if (p && p.isEnabled()) out.push(p);
  }
  return out;
}

/**
 * Cascade: try each enabled provider in order. The first success wins.
 * Returns `null` when no provider is configured or all of them fail.
 */
export async function runVisionCascade(req: VisionRequest): Promise<VisionResult | null> {
  const providers = orderedEnabled();
  if (providers.length === 0) return null;

  for (const p of providers) {
    try {
      const out = await p.run(req);
      if (out.rawText && !out.rawText.includes('----no readable prescription----')) {
        return out;
      }
      // Empty / "couldn't read" — try the next provider.
      console.warn(`[vision] ${p.name} returned no usable text, trying next`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[vision] ${p.name} failed: ${msg}`);
    }
  }
  return null;
}

export type { VisionProvider, VisionRequest, VisionResult } from './types.js';
