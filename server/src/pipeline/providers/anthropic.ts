import type { VisionProvider, VisionRequest, VisionResult } from './types.js';
import { READ_PROMPT } from './types.js';

// Claude Vision provider. Lazy-loads @anthropic-ai/sdk so the dependency is
// only required if ANTHROPIC_API_KEY is set.
//
// Model: claude-sonnet-4-5 (good handwriting reader; bump to opus for harder
// cases by setting ANTHROPIC_MODEL).

export const anthropicVision: VisionProvider = {
  name: 'anthropic',
  isEnabled: () => Boolean(process.env.ANTHROPIC_API_KEY),
  async run(req: VisionRequest): Promise<VisionResult> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    // Dynamic import so the SDK isn't bundled unless the key is present.
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5';
    const base64 = req.image.toString('base64');

    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
            { type: 'text', text: READ_PROMPT },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
    const detectedLines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
    return {
      provider: 'anthropic',
      rawText,
      detectedLines,
      confidence: 'high', // Claude doesn't emit a numeric score; we just pass-through.
    };
  },
};
