// =============================================================================
// nlp — runs the parser over the raw OCR text and returns a structured
// medication list. The actual work is split across three sibling modules:
//
//   - ./brands.ts        — known-brand formulary + lookup helper
//   - ./dosing.ts        — Arabic + English frequency / duration extraction
//   - ./line-parser.ts   — Rx line tokenisation
//
// This file is the orchestration layer: it walks the OCR text line-by-line,
// pairs each Rx head with its following instruction line (if any), and
// builds MedicationEntry objects.
// =============================================================================

import { randomUUID } from 'node:crypto';
import type { NlpInput, NlpOutput } from '@roshetta/shared/pipeline.js';
import type { MedicationEntry, ParseConfidence } from '@roshetta/shared/prescription.js';
import { lookupBrand } from './brands.js';
import { deriveDosing, looksArabic } from './dosing.js';
import { RX_PREFIX, parseHead, parseLineBody } from './line-parser.js';

const MIN_DELAY_MS = 800;
const MAX_DELAY_MS = 1200;

function buildEntry(body: string, followingInstructionLine: string): MedicationEntry {
  // Explicit "illegible" markers — surface to the UI rather than dropping.
  if (/illegible/i.test(body)) {
    return makeUnrecognized(body);
  }

  const { head, inlineInstruction, inlineIndication } = parseLineBody(body);
  const { rawName, strength } = parseHead(head);
  const known = lookupBrand(rawName);

  // Prefer the next-line instruction (modern format); fall back to the
  // inline "— instructions" portion (legacy format).
  const instruction = followingInstructionLine || inlineInstruction;
  const { frequency, duration } = deriveDosing(instruction);

  const indication = inlineIndication || known?.defaultIndication || 'as directed by the prescriber';
  const confidence: ParseConfidence = known ? 'confident' : 'unrecognized';

  return {
    id: randomUUID(),
    rawName,
    canonicalName: known?.canonical ?? rawName,
    activeIngredient: known?.activeIngredient ?? '',
    strength,
    form: known?.form ?? '',
    frequency,
    duration,
    indication,
    confidence,
  };
}

function makeUnrecognized(body: string): MedicationEntry {
  return {
    id: randomUUID(),
    rawName: body.trim(),
    canonicalName: 'Unrecognized item',
    activeIngredient: '',
    strength: '',
    form: '',
    frequency: '',
    duration: '',
    indication: '',
    confidence: 'unrecognized',
  };
}

/**
 * Decide whether the line immediately after an Rx head should be consumed
 * as its dosing instruction. We accept indented lines, Arabic-script lines,
 * and lines starting with a digit or a common English dosing verb — and
 * never another Rx line.
 */
function shouldConsumeAsInstruction(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === '') return false;
  if (RX_PREFIX.test(trimmed)) return false;
  if (/^\s/.test(raw)) return true;
  if (looksArabic(trimmed)) return true;
  return /^(?:\d|every|once|twice|three|apply|take)/i.test(trimmed);
}

/**
 * SIMULATED delay so the UI's "Identify medications" stage feels like real
 * work even with the parser running instantly.
 */
function simulatedDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runNlpParser(input: NlpInput): Promise<NlpOutput> {
  await simulatedDelay();

  const lines = input.rawText.split(/\r?\n/);
  const medications: MedicationEntry[] = [];
  const warnings: string[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i)) continue;
    const line = lines[i]!;
    const m = line.match(RX_PREFIX);
    if (!m) continue;

    const body = m[1]!.trim();
    // Skip header tokens like "Rx:" / empty bodies.
    if (body.length < 2 || !/[A-Za-z؀-ۿ]/.test(body)) continue;

    // Look ahead one non-empty line for an instruction.
    let following = '';
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j]!;
      if (next.trim() === '') continue;
      if (shouldConsumeAsInstruction(next)) {
        following = next.trim();
        consumed.add(j);
      }
      break;
    }

    const entry = buildEntry(body, following);
    medications.push(entry);

    if (entry.confidence === 'unrecognized') {
      if (/illegible/i.test(body)) {
        warnings.push('At least one prescription line was not legible enough to parse.');
      } else {
        warnings.push(`We couldn't recognize "${entry.rawName}" — please verify with your pharmacist.`);
      }
    }
  }

  return { medications, warnings: Array.from(new Set(warnings)) };
}
