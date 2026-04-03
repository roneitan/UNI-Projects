import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractJson, buildPrompt } from '../../src/agents/agentRouter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '../fixtures/null-ref-failure.json'), 'utf-8'),
);

const SERVICE = {
  id: 'auth-service',
  displayName: 'Auth Service',
  agent: {
    prompt: 'Handles JWT. Pay attention to token expiry tests.',
    createFixBranch: false,
  },
};

// ─── extractJson ──────────────────────────────────────────────────────────────

describe('extractJson', () => {
  it('parses a valid JSON block', () => {
    const text = `
Some analysis here.

\`\`\`json
{
  "status": "FAILED",
  "passed": 44,
  "total": 47,
  "failures": [{ "test": "Login_WithExpiredToken", "file": "JwtHandlerTests.cs", "error": "NullRef", "rootCause": "null check missing", "suggestedFix": "add null guard", "fixed": false }],
  "confidence": "HIGH",
  "confidenceReason": "root cause is clear"
}
\`\`\``;
    const result = extractJson(text);
    expect(result.parsed).toBe(true);
    expect(result.status).toBe('FAILED');
    expect(result.passed).toBe(44);
    expect(result.total).toBe(47);
    expect(result.failures).toHaveLength(1);
    expect(result.confidence).toBe('HIGH');
  });

  it('returns error object when no JSON block is present', () => {
    const result = extractJson('Just some plain text with no JSON block.');
    expect(result.parsed).toBe(false);
    expect(result.status).toBe('ERROR');
  });

  it('returns error object when JSON block is malformed', () => {
    const result = extractJson('```json\n{ "status": "FAILED", INVALID }\n```');
    expect(result.parsed).toBe(false);
    expect(result.status).toBe('ERROR');
  });

  it('handles PASSED status correctly', () => {
    const text = '```json\n{"status":"PASSED","passed":120,"total":120,"failures":[],"confidence":"HIGH","confidenceReason":"all green"}\n```';
    const result = extractJson(text);
    expect(result.status).toBe('PASSED');
    expect(result.failures).toHaveLength(0);
  });
});

// ─── buildPrompt ──────────────────────────────────────────────────────────────

describe('buildPrompt', () => {
  it('injects the test results JSON into the prompt', () => {
    const prompt = buildPrompt(SERVICE, fixture);
    expect(prompt).toContain(fixture.serviceId);
    expect(prompt).toContain('"failed": 3');
  });

  it('injects the service-specific prompt', () => {
    const prompt = buildPrompt(SERVICE, fixture);
    expect(prompt).toContain('Handles JWT');
    expect(prompt).toContain('token expiry');
  });

  it('includes analysis-only instructions when createFixBranch is false', () => {
    const prompt = buildPrompt({ ...SERVICE, agent: { ...SERVICE.agent, createFixBranch: false } }, fixture);
    expect(prompt).toContain('analysis only');
    expect(prompt).not.toContain('Write and Edit tools');
  });

  it('includes fix instructions when createFixBranch is true', () => {
    const prompt = buildPrompt({ ...SERVICE, agent: { ...SERVICE.agent, createFixBranch: true } }, fixture);
    expect(prompt).toContain('Write and Edit tools');
    expect(prompt).not.toContain('analysis only');
  });

  it('contains the required output format section', () => {
    const prompt = buildPrompt(SERVICE, fixture);
    expect(prompt).toContain('```json');
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('"failures"');
    expect(prompt).toContain('"confidence"');
  });
});
