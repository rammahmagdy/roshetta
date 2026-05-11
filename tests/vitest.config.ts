import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    include: ['unit/**/*.test.ts', 'integration/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    environment: 'node',
    globals: false,
    reporters: ['default'],
  },
  resolve: {
    alias: {
      '@roshetta/shared/pipeline.js': resolve(__dirname, '../shared/types/pipeline.ts'),
      '@roshetta/shared/prescription.js': resolve(__dirname, '../shared/types/prescription.ts'),
      '@roshetta/shared/events.js': resolve(__dirname, '../shared/types/events.ts'),
      '@roshetta/shared/schemas.js': resolve(__dirname, '../shared/types/schemas.ts'),
      '@roshetta/shared/country.js': resolve(__dirname, '../shared/types/country.ts'),
      '@roshetta/shared/drug.js': resolve(__dirname, '../shared/types/drug.ts'),
      '@roshetta/shared': resolve(__dirname, '../shared/types/index.ts'),
    },
  },
});
