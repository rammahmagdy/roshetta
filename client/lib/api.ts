import type { PipelineEvent } from '@roshetta/shared/events.js';

export interface SubmitOptions {
  onEvent: (event: PipelineEvent) => void;
  signal?: AbortSignal;
  country?: string;
}

export class SubmissionError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'SubmissionError';
  }
}

export async function submitPrescription(
  file: Blob,
  filename: string,
  { onEvent, signal, country }: SubmitOptions,
): Promise<void> {
  const form = new FormData();
  form.append('image', file, filename);

  const res = await fetch('/api/prescriptions', {
    method: 'POST',
    body: form,
    signal,
    headers: country ? { 'X-Country': country } : undefined,
  });

  if (!res.ok) {
    let message = `Server returned ${res.status}.`;
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody.error) message = errBody.error;
    } catch {
      // ignore JSON parse failures; fall through to generic message
    }
    throw new SubmissionError(res.status, message);
  }

  if (!res.body) {
    throw new SubmissionError(500, 'Server returned an empty response stream.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLines = rawEvent
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim());
      if (dataLines.length === 0) continue;
      try {
        const parsed = JSON.parse(dataLines.join('\n')) as PipelineEvent;
        onEvent(parsed);
      } catch {
        // Skip malformed events rather than aborting the stream.
      }
    }
  }
}
