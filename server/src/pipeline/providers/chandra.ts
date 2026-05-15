import type { OcrOutput } from '@roshetta/shared/pipeline.js';
import type { StructuredMedication } from './types.js';

const DEFAULT_TIMEOUT_MS = 45_000;

type ChandraMode = 'off' | 'prefer' | 'only';

export function chandraMode(): ChandraMode {
  const raw = (process.env.CHANDRA_OCR_MODE ?? 'prefer').trim().toLowerCase();
  if (raw === 'off' || raw === 'only' || raw === 'prefer') return raw;
  return 'prefer';
}

export function isChandraEnabled(): boolean {
  return chandraMode() !== 'off' && Boolean(process.env.CHANDRA_OCR_URL);
}

function timeoutMs(): number {
  const parsed = Number(process.env.CHANDRA_OCR_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function countLines(text: string): number {
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

function normalizeConfidence(value: unknown): StructuredMedication['confidence'] {
  return value === 'unrecognized' ? 'unrecognized' : 'confident';
}

function normalizeMedication(input: unknown): StructuredMedication | null {
  if (!input || typeof input !== 'object') return null;
  const item = input as Record<string, unknown>;
  const rawName = asString(item.rawName ?? item.raw_name ?? item.name ?? item.drug ?? item.medication);
  const canonicalName = asString(item.canonicalName ?? item.canonical_name ?? item.normalizedName ?? item.normalized_name) || rawName;
  if (!rawName && !canonicalName) return null;

  return {
    rawName: rawName || canonicalName,
    canonicalName: canonicalName || rawName,
    activeIngredient: asString(item.activeIngredient ?? item.active_ingredient ?? item.ingredient),
    strength: asString(item.strength ?? item.dose ?? item.dosage),
    form: asString(item.form),
    frequency: asString(item.frequency ?? item.instructions),
    duration: asString(item.duration),
    indication: asString(item.indication),
    confidence: normalizeConfidence(item.confidence),
  };
}

function normalizeMedications(value: unknown): StructuredMedication[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const meds = value.map(normalizeMedication).filter((med): med is StructuredMedication => Boolean(med));
  return meds.length ? meds : undefined;
}

function normalizeWarnings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const warnings = value.map(asString).filter(Boolean);
  return warnings.length ? warnings : undefined;
}

function extractPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const data = obj.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  const result = obj.result;
  if (result && typeof result === 'object' && !Array.isArray(result)) return result as Record<string, unknown>;
  return obj;
}

function normalizeChandraResponse(raw: unknown): OcrOutput | null {
  const payload = extractPayload(raw);
  const rawText =
    asString(payload.rawText) ||
    asString(payload.raw_text) ||
    asString(payload.markdown) ||
    asString(payload.text) ||
    asString(payload.html);
  const structuredMedications = normalizeMedications(
    payload.structuredMedications ?? payload.medications ?? payload.drugs ?? payload.items,
  );
  const warnings = normalizeWarnings(payload.warnings);

  if (!rawText && !structuredMedications?.length) return null;

  return {
    rawText: rawText || structuredMedications!.map((m) => [m.rawName, m.strength, m.frequency, m.duration].filter(Boolean).join(' ')).join('\n'),
    detectedLines: Number(payload.detectedLines ?? payload.detected_lines) || countLines(rawText) || structuredMedications?.length || 0,
    structuredMedications,
    warnings,
  };
}

export async function runChandraOcr(image: Buffer): Promise<OcrOutput | null> {
  const url = process.env.CHANDRA_OCR_URL;
  if (!url || chandraMode() === 'off') return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (process.env.CHANDRA_OCR_API_KEY) headers.authorization = `Bearer ${process.env.CHANDRA_OCR_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64: image.toString('base64'),
        image_type: 'image/png',
        output_format: 'json',
        languages: ['ar', 'en'],
        task: 'prescription_ocr',
      }),
    });

    if (!response.ok) {
      throw new Error(`Chandra OCR returned HTTP ${response.status}`);
    }

    const payload = await response.json() as unknown;
    return normalizeChandraResponse(payload);
  } finally {
    clearTimeout(timeout);
  }
}
