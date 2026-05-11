// Shared contract every vision provider implements. Each provider returns
// raw OCR text — the downstream NLP parser does the structure extraction
// (so a provider failure can be retried by the cascade without breaking the
// rest of the pipeline).

export interface VisionRequest {
  image: Buffer;
  /** Hints to bias the model toward Egyptian/MENA prescriptions. */
  promptHints?: {
    /** ISO country code, e.g. "EG". */
    country?: string;
    /** Languages present on the prescription. */
    languages?: readonly ('ar' | 'en')[];
  };
}

export interface VisionResult {
  /** Provider that produced this result. */
  provider: string;
  /** Raw text the model extracted from the prescription. */
  rawText: string;
  /** Approximate count of detected non-empty lines. */
  detectedLines: number;
  /** Free-form confidence string if the model exposes one. */
  confidence?: string;
}

export interface VisionProvider {
  readonly name: string;
  readonly isEnabled: () => boolean;
  readonly run: (req: VisionRequest) => Promise<VisionResult>;
}

/** The prompt we send to every vision-capable LLM. Tuned for Egyptian /
 * MENA-style handwritten prescriptions with mixed Arabic + English. */
export const READ_PROMPT = `You are a medical OCR specialist trained on Egyptian and MENA-region handwritten prescriptions. Your job: read the prescription image and produce CLEAN, STRUCTURED raw text.

OUTPUT FORMAT — follow this exactly, one Rx item per block:

Rx <brand name as written> <strength if visible>
   <dosing instructions, verbatim, in their original language>

Rules:
- Preserve Arabic dosing lines verbatim (do not translate).
- If a word is illegible, write "----illegible----" instead of guessing.
- Common Egyptian brands you may encounter (use canonical spelling when confident): Augmentin, Catafast, Cataflam, Mobic, Mobix, Olfen, Voltaren, Multinerv, Neurorubine, Nexium, Motilium, Gaviscon, Glucophage, Amaryl, Concor, Lipitor, Aspocid, Vastarel, Otrivin, Brufen, Panadol, Claritine, Maxicalc.
- Common doctor shorthand: TDS = three times daily, BID/BD = twice daily, QID = four times daily, OD = once daily, PRN = as needed, HS = at bedtime.
- Output ONLY the structured Rx blocks. No preamble, no commentary, no markdown.
- If you cannot read the image at all, output a single line: "----no readable prescription----"
`;
