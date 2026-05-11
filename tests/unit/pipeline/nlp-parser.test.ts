import { describe, expect, it } from 'vitest';
import { runNlpParser } from '../../../server/src/pipeline/nlp-parser.js';

const EGYPTIAN_HOSPITAL_SAMPLE = `Air Force Specialized Hospital — Cairo
Date: 22/3/2024

Rx Multinerv 5mg
   مرتين يومياً بعد الأكل

Rx Catafast 100
   كيس مرتين يومياً عند الحاجة

Rx Mobic 15
   قرص يومياً صباحاً

Rx ----illegible---- nasal drops
   نقطة في كل فتحة كل 6 ساعات
`;

const LEGACY_INLINE_SAMPLE = `Dr. Foo
Rx:
1) Augmentin 1g — 1 tab every 12 hours x 7 days  (bacterial sinusitis)
2) Panadol Extra 500mg — 1 tab every 8 hours as needed (fever / pain)
`;

describe('nlp-parser — Egyptian hospital format (Rx + Arabic instructions)', () => {
  it('extracts every Rx-prefixed line into a medication entry', async () => {
    const out = await runNlpParser({ rawText: EGYPTIAN_HOSPITAL_SAMPLE });
    expect(out.medications.length).toBe(4);
  });

  it('flags the illegible line as unrecognized and emits a warning', async () => {
    const out = await runNlpParser({ rawText: EGYPTIAN_HOSPITAL_SAMPLE });
    const illegible = out.medications.filter((m) => m.confidence === 'unrecognized');
    expect(illegible.length).toBeGreaterThanOrEqual(1);
    expect(out.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it('normalizes Multinerv to its active ingredient (Vitamin B complex)', async () => {
    const out = await runNlpParser({ rawText: EGYPTIAN_HOSPITAL_SAMPLE });
    const multinerv = out.medications.find((m) => m.canonicalName === 'Multinerv');
    expect(multinerv).toBeDefined();
    expect(multinerv!.activeIngredient).toMatch(/Vitamin\s*B/i);
    expect(multinerv!.confidence).toBe('confident');
  });

  it('normalizes Catafast to Diclofenac Potassium and reads "100" as the strength', async () => {
    const out = await runNlpParser({ rawText: EGYPTIAN_HOSPITAL_SAMPLE });
    const catafast = out.medications.find((m) => m.canonicalName === 'Catafast');
    expect(catafast).toBeDefined();
    expect(catafast!.activeIngredient).toMatch(/Diclofenac/i);
    expect(catafast!.strength).toBe('100');
  });

  it('translates Arabic dosing cues to readable frequency labels', async () => {
    const out = await runNlpParser({ rawText: EGYPTIAN_HOSPITAL_SAMPLE });
    const multinerv = out.medications.find((m) => m.canonicalName === 'Multinerv');
    expect(multinerv!.frequency).toMatch(/twice/i);
    const mobic = out.medications.find((m) => m.canonicalName === 'Mobic');
    expect(mobic!.frequency).toMatch(/once/i);
  });

  it('treats common doctor-shorthand misspellings as the canonical brand', async () => {
    const out = await runNlpParser({ rawText: 'Rx Mobix 15\n   قرص يومياً صباحاً' });
    const m = out.medications[0]!;
    expect(m.canonicalName).toBe('Mobic');
    expect(m.confidence).toBe('confident');
  });
});

describe('nlp-parser — legacy inline format (1) Brand — instructions (indication))', () => {
  it('still parses every numbered line into a medication entry', async () => {
    const out = await runNlpParser({ rawText: LEGACY_INLINE_SAMPLE });
    expect(out.medications.length).toBe(2);
  });

  it('extracts strength, frequency, duration, and indication for known brands', async () => {
    const out = await runNlpParser({ rawText: LEGACY_INLINE_SAMPLE });
    const augmentin = out.medications.find((m) => m.canonicalName === 'Augmentin');
    expect(augmentin).toBeDefined();
    expect(augmentin!.strength).toMatch(/1\s*g/i);
    expect(augmentin!.frequency).toMatch(/every 12 hours/i);
    expect(augmentin!.duration).toMatch(/7\s*days/i);
    expect(augmentin!.indication).toMatch(/sinusitis/i);
    expect(augmentin!.activeIngredient).toMatch(/Amoxicillin/i);
    expect(augmentin!.confidence).toBe('confident');
  });
});
