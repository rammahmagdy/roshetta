import type { VisionProvider, VisionRequest, VisionResult } from './types.js';
import { READ_PROMPT } from './types.js';
import { isUsable, parseVisionResponse, reconstructText } from './_parse.js';

// =============================================================================
// OpenAI direct provider — uses GPT-4o (or whatever OPENAI_MODEL says) with
// JSON-mode for STRUCTURED medications. Lazy-loads the `openai` SDK so the
// import never runs unless OPENAI_API_KEY is set.
// =============================================================================

export const openaiVision: VisionProvider = {
  name: 'openai',
  isEnabled: () => Boolean(process.env.OPENAI_API_KEY),
  async run(req: VisionRequest): Promise<VisionResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set');
    }
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
    const base64 = req.image.toString('base64');

    const response = await client.chat.completions.create({
      model,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: READ_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64}`, detail: 'high' },
            },
          ],
        },
      ],
    });

    const rawResponse = response.choices[0]?.message?.content?.trim() ?? '';
    const parsed = parseVisionResponse(rawResponse);
    if (!isUsable(parsed)) {
      throw new Error(`OpenAI returned no usable medications (model=${model})`);
    }
    const rawText = reconstructText(parsed.medications);
    return {
      provider: `openai:${model}`,
      rawText,
      detectedLines: rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length,
      medications: parsed.medications,
      warnings: parsed.warnings,
      confidence: 'high',
    };
  },
};
