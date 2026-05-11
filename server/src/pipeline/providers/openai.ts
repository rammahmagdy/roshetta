import type { VisionProvider, VisionRequest, VisionResult } from './types.js';
import { READ_PROMPT } from './types.js';

// GPT-4o Vision provider. Lazy-loads `openai` so it only runs when
// OPENAI_API_KEY is set.

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
      max_tokens: 1024,
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

    const rawText = response.choices[0]?.message?.content?.trim() ?? '';
    const detectedLines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
    return {
      provider: 'openai',
      rawText,
      detectedLines,
      confidence: 'high',
    };
  },
};
