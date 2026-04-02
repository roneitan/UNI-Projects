import { defineConfig } from 'vitest/config';

// Integration tests — calls real Claude API, requires .env, slow & costs money.
// Run on PR merge only: npm run test:integration
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.js'],
    environment: 'node',
    reporters: ['verbose'],
    timeout: 120_000,
    // Run sequentially — avoid hammering the API in parallel
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
