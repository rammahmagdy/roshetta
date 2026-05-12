// =============================================================================
// Shared JSON-parsing logic used by every vision provider. The vision LLM is
// asked for a strict JSON object via READ_PROMPT; this module normalizes the
// shape into StructuredMedication[] + warnings.
// =============================================================================

import type { StructuredMedication } from './types.js';

interface RawJsonPayload {
  medications?: Array<{
    raw_name?: string;
    canonical_name?: string;
    active_ingredient?: string;
    strength?: string;
    form?: string;
    frequency?: string;
    duration?: string;
    indication?: string;
    confidence?: string;
  }>;
  warnings?: string[];
}

export interface ParsedVisionResponse {
  medications: StructuredMedication[];
  warnings: string[];
}

/** Strip ```json fences if the model added them anyway. */
function stripCodeFence(s: string): string {
  const t = s.trim();
  if (t.startsWith('```')) {
    return t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return t;
}

function normalizeMedication(m: NonNullable<RawJsonPayload['medications']>[number]): StructuredMedication {
  const rawName = (m.raw_name ?? '').trim();
  const canonicalName = (m.canonical_name ?? '').trim() || rawName || 'Unrecognized item';
  const isUnrecognized =
    (m.confidence ?? '').toLowerCase() === 'unrecognized' ||
    /illegible/i.test(rawName) ||
    canonicalName.toLowerCase() === 'unrecognized item';
  return {
    rawName: rawName || canonicalName,
    canonicalName,
    activeIngredient: (m.active_ingredient ?? '').trim(),
    strength: (m.strength ?? '').trim(),
    form: (m.form ?? '').trim(),
    frequency: (m.frequency ?? '').trim() || 'as directed',
    duration: (m.duration ?? '').trim() || 'as needed',
    indication: (m.indication ?? '').trim(),
    confidence: isUnrecognized ? 'unrecognized' : 'confident',
  };
}

/**
 * Parse a vision-model response. Returns null when the response wasn't valid
 * JSON, so callers can cascade to the next provider. Throws nothing.
 */
export function parseVisionResponse(rawResponse: string): ParsedVisionResponse | null {
  if (!rawResponse) return null;
  let parsed: RawJsonPayload;
  try {
    parsed = JSON.parse(stripCodeFence(rawResponse)) as RawJsonPayload;
  } catch {
    return null;
  }
  const medications = Array.isArray(parsed.medications)
    ? parsed.medications.map(normalizeMedication)
    : [];
  const warnings = Array.isArray(parsed.warnings)
    ? parsed.warnings.filter((w): w is string => typeof w === 'string')
    : [];
  return { medications, warnings };
}

/** A response is "usable" if it has any medications OR any warnings. */
export function isUsable(parsed: ParsedVisionResponse | null): parsed is ParsedVisionResponse {
  if (!parsed) return false;
  return parsed.medications.length > 0 || parsed.warnings.length > 0;
}

/** Reconstruct a human-readable text fallback. Used as the legacy `rawText`
 *  field on VisionResult so callers that haven't been updated to look at
 *  `medications` still get something sensible. */
export function reconstructText(medications: StructuredMedication[]): string {
  return medications
    .map((m) => `Rx ${m.canonicalName} ${m.strength}\n   ${m.frequency} · ${m.duration}`)
    .join('\n\n');
}

/** Score a parsed response: confident medications double-count. Used by the
 *  ensemble path to pick a winner. */
export function scoreResponse(parsed: ParsedVisionResponse): number {
  return parsed.medications.reduce(
    (sum, m) => sum + (m.confidence === 'confident' ? 2 : 1),
    0,
  );
}
