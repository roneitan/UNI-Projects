import { defineConfig } from 'vitest/config';

// Unit tests — fast, no real credentials needed, run on every commit
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
    reporters: ['verbose'],
  },
});
