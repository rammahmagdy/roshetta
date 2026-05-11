// =============================================================================
// dosing — translate frequency + duration cues from Arabic (or English
// shorthand: TDS / BID / QID / PRN / HS / OD) into readable English labels.
// =============================================================================

const ARABIC_RANGE = /[؀-ۿ]/;

export function looksArabic(s: string): boolean {
  return ARABIC_RANGE.test(s);
}

export interface DerivedDosing {
  frequency: string;
  duration: string;
}

interface PatternMap {
  test: RegExp;
  value: string;
}

const ARABIC_FREQUENCY_PATTERNS: PatternMap[] = [
  { test: /3\s*مرات\s*يومياً|ثلاث(ة)?\s*مرات/, value: 'three times daily' },
  { test: /مرتين\s*يومياً|مرتين\s*في\s*اليوم/, value: 'twice daily' },
  { test: /كل\s*12\s*ساعة/, value: 'every 12 hours' },
  { test: /كل\s*8\s*ساعات/, value: 'every 8 hours' },
  { test: /كل\s*6\s*ساعات/, value: 'every 6 hours' },
  { test: /(يومياً\s*صباحاً)|(صباحاً)/, value: 'once daily, mornings' },
  { test: /قبل\s*النوم/, value: 'once daily, at bedtime' },
  { test: /يومياً|مرة\s*يومياً|قرص\s*يومياً|كبسولة\s*يومياً/, value: 'once daily' },
  { test: /عند\s*الحاجة/, value: 'as needed' },
  { test: /موضعياً/, value: 'apply topically' },
];

const ENGLISH_FREQUENCY = /(every\s+\d+\s*h(?:ours)?|once\s+daily|twice\s+daily|three\s+times\s+daily|at\s+bedtime|after\s+meals?\s+as\s+needed|as\s+needed|before\s+breakfast|q\d+h|tds|bid|bd|qid|od|prn|hs)/i;
const ENGLISH_DURATION = /(?:x|for)\s+(\d+\s*(?:days?|weeks?|d|w))/i;

const SHORTHAND: Record<string, string> = {
  tds: 'three times daily',
  bid: 'twice daily',
  bd: 'twice daily',
  qid: 'four times daily',
  od: 'once daily',
  prn: 'as needed',
  hs: 'at bedtime',
};

function expandEnglishShorthand(match: string): string {
  const key = match.toLowerCase();
  if (SHORTHAND[key]) return SHORTHAND[key]!;
  if (/^q\d+h$/i.test(key)) return `every ${key.match(/\d+/)?.[0] ?? ''} hours`;
  return match.trim();
}

function deriveFromArabic(instruction: string): DerivedDosing {
  let frequency = '';
  for (const pattern of ARABIC_FREQUENCY_PATTERNS) {
    if (pattern.test.test(instruction)) {
      frequency = pattern.value;
      break;
    }
  }

  let duration = 'as directed';
  const durationMatch = instruction.match(/(?:لمدة|ل)\s*(\d+)\s*(يوم(?:اً)?|أيام|أسبوع|أسابيع)/);
  if (durationMatch) {
    const num = durationMatch[1]!;
    const unit = /أسبوع|أسابيع/.test(durationMatch[2]!) ? 'weeks' : 'days';
    duration = `${num} ${unit}`;
  }

  return { frequency: frequency || 'as directed', duration };
}

function deriveFromEnglish(instruction: string): DerivedDosing {
  const fr = instruction.match(ENGLISH_FREQUENCY);
  const frequency = fr ? expandEnglishShorthand(fr[1]!.trim()) : 'as directed';

  const dr = instruction.match(ENGLISH_DURATION);
  let duration = 'as needed';
  if (dr) {
    const raw = dr[1]!.trim();
    // Normalize 'd' → 'days', 'w' → 'weeks' if it's a single letter unit.
    duration = raw.replace(/\b(\d+)\s*d\b/i, '$1 days').replace(/\b(\d+)\s*w\b/i, '$1 weeks');
  }

  return { frequency, duration };
}

/**
 * Pick the right derivation based on script. We default to English when
 * neither side matches, so the UI always shows something useful.
 */
export function deriveDosing(instruction: string): DerivedDosing {
  if (!instruction) return { frequency: 'as directed', duration: 'as needed' };
  if (looksArabic(instruction)) return deriveFromArabic(instruction);
  return deriveFromEnglish(instruction);
}
