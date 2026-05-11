import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { config as dotenvConfig } from 'dotenv';

// Load .env from the project root regardless of where Node was launched from.
// We look up to three levels above the file to find the workspace root.
function findEnvPath(): string | null {
  const here = new URL('.', import.meta.url).pathname;
  const candidates = [
    resolve(here, '../../../.env'),     // server/.env (workspace local)
    resolve(here, '../../../../.env'),  // roshetta/.env (preferred)
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

const envPath = findEnvPath();
if (envPath) {
  dotenvConfig({ path: envPath });
}

// The server always uses SERVER_PORT (defaults to 4000). It deliberately
// ignores PORT because that's reserved for the Next.js client in production
// — Railway injects PORT for the public-facing process, which is the client.
export const env = {
  PORT: Number(process.env.SERVER_PORT ?? 4000),
  isProd: process.env.NODE_ENV === 'production',
  /** True when any vision provider is configured. */
  hasVision:
    Boolean(process.env.OPENROUTER_API_KEY) ||
    Boolean(process.env.ANTHROPIC_API_KEY) ||
    Boolean(process.env.OPENAI_API_KEY) ||
    Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY),
} as const;
