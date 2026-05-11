import type { VisionProvider, VisionRequest, VisionResult } from './types.js';
import { READ_PROMPT } from './types.js';

// Gemini Vision provider. Lazy-loads @google/generative-ai when
// GEMINI_API_KEY (or GOOGLE_API_KEY) is set.

export const googleVision: VisionProvider = {
  name: 'google',
  isEnabled: () => Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
  async run(req: VisionRequest): Promise<VisionResult> {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY / GOOGLE_API_KEY not set');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const base64 = req.image.toString('base64');
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: 'image/png' } },
      READ_PROMPT,
    ]);
    const rawText = result.response.text().trim();
    const detectedLines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
    return {
      provider: 'google',
      rawText,
      detectedLines,
      confidence: 'high',
    };
  },
};
