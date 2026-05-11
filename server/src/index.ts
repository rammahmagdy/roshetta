// MUST be the first import so process.env is populated before any module
// (e.g. the vision providers) reads from it.
import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[roshetta] server listening on http://localhost:${env.PORT}`);
  if (env.hasVision) {
    console.log('[roshetta] vision pipeline: REAL provider configured (see ENV).');
  } else {
    console.log('[roshetta] vision pipeline: SIMULATED (no API keys set — using bundled mock samples).');
  }
});
