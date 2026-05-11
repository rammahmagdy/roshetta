// Real-server smoke test: spawns the Express server, hits /api/health and
// /api/prescriptions, asserts the SSE stream ends with pipeline_complete.
//
// Run with: npm run smoke

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(here, '../fixtures/prescription-clear.png');
const PORT = 4101; // dedicated port to avoid collisions

const server = spawn('npx', ['tsx', resolve(here, '../../server/src/index.ts')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'inherit', 'inherit'],
});

let exited = false;
server.on('exit', () => { exited = true; });

const cleanup = () => {
  if (!exited) server.kill('SIGTERM');
};
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

async function waitForHealth(): Promise<void> {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/health`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('server never became healthy');
}

async function main(): Promise<void> {
  await waitForHealth();
  console.log('[smoke] server is healthy');

  const fixture = await readFile(FIXTURE);
  const form = new FormData();
  form.append('image', new Blob([fixture], { type: 'image/png' }), 'rx.png');

  const res = await fetch(`http://localhost:${PORT}/api/prescriptions`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok || !res.body) {
    throw new Error(`prescriptions POST failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastType = '';
  let medicationCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const data = block
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('\n');
      if (!data) continue;
      const event = JSON.parse(data) as { type: string; [k: string]: unknown };
      lastType = event.type;
      console.log(`[smoke] event: ${event.type}${event.stage ? ' · ' + event.stage : ''}`);
      if (event.type === 'pipeline_complete') {
        const result = event.result as { medications: unknown[] };
        medicationCount = result.medications.length;
      }
    }
  }

  if (lastType !== 'pipeline_complete') {
    throw new Error(`expected last event pipeline_complete, got ${lastType}`);
  }
  if (medicationCount < 1) {
    throw new Error('expected at least one medication in the result');
  }
  console.log(`[smoke] ✓ pipeline_complete with ${medicationCount} medication(s)`);
}

main()
  .then(() => {
    cleanup();
    process.exit(0);
  })
  .catch((err) => {
    console.error('[smoke] FAILED:', err);
    cleanup();
    process.exit(1);
  });
