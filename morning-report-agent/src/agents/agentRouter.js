import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fse from 'fs-extra';
import { format } from 'date-fns';
import { getRunner } from './runners/index.js';
import { REPORTS_DIR } from '../paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_PROMPT = readFileSync(join(__dirname, 'prompts/base-analysis.md'), 'utf-8');

/**
 * Route a service analysis run to the correct provider runner.
 *
 * provider = 'claude' → runners/claudeRunner.js  (@anthropic-ai/claude-agent-sdk)
 * provider = 'openai' → runners/codexRunner.js   (openai SDK with function tools)
 *
 * Adding a new provider: see runners/index.js for the 3-step checklist.
 *
 * @param {import('../../services/base.schema.js').Service} service
 * @param {object} testResults   - Raw JSON from azureCollector
 * @param {{ automation: string, service: string|null, useWorktreeIsolation: boolean }} repoPaths
 * @param {Date} date
 * @returns {Promise<object>} Parsed structured result from the agent
 */
export async function analyze(service, testResults, repoPaths, date) {
  const provider = service.agent.provider ?? 'claude';
  const runFn = getRunner(provider); // throws with helpful error on unknown provider

  const dateStr = format(date, 'yyyy-MM-dd');
  const prompt = buildPrompt(service, testResults);

  console.log(`[agentRouter] Starting: ${service.displayName} (provider: ${provider})`);

  const { fullText, costUsd } = await runFn(prompt, repoPaths, {
    model: service.agent.model,
    maxTurns: service.agent.maxTurns,
    maxBudgetUsd: service.agent.maxBudgetUsd,
    createFixBranch: service.agent.createFixBranch,
  });

  const structured = extractJson(fullText);

  // ── Persist results ─────────────────────────────────────────────────────────
  const reportsDir = join(REPORTS_DIR, dateStr);
  await fse.ensureDir(reportsDir);

  // Full markdown analysis
  await fse.writeFile(join(reportsDir, `${service.id}.md`), fullText);

  // Structured JSON sidecar — consumed by teamsReporter
  const sidecar = {
    ...structured,
    serviceId: service.id,
    displayName: service.displayName,
    provider,
    costUsd,
    generatedAt: new Date().toISOString(),
  };
  await fse.writeJson(join(reportsDir, `${service.id}.json`), sidecar, { spaces: 2 });

  if (costUsd !== null) {
    console.log(`[agentRouter] Done: ${service.displayName} — ${structured.status} — $${costUsd.toFixed(4)}`);
  } else {
    console.log(`[agentRouter] Done: ${service.displayName} — ${structured.status}`);
  }

  return structured;
}

// ─── Helpers (exported for unit testing) ─────────────────────────────────────

export function buildPrompt(service, testResults) {
  const fixInstructions = service.agent.createFixBranch
    ? `You have Write and Edit tools available.
If you identify a clear, safe fix for a failing test, apply it directly to the
file. Set "fixed": true in the JSON output for each test you actually fix.
Do not fix flaky tests or tests that require deeper architectural changes —
flag those with "fixed": false and explain in suggestedFix.`
    : `Do not modify any files — this run is analysis only.
Set "fixed": false for all failures.`;

  return BASE_PROMPT
    .replace('{{TEST_RESULTS_JSON}}', JSON.stringify(testResults, null, 2))
    .replace('{{SERVICE_PROMPT}}', service.agent.prompt)
    .replace('{{FIX_INSTRUCTIONS}}', fixInstructions);
}

export function extractJson(text) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```(?=[^`]|$)/);
  if (!match) {
    console.warn('[agentRouter] No JSON block found in agent output — using fallback');
    return { status: 'ERROR', passed: 0, total: 0, failures: [], confidence: 'LOW', parsed: false };
  }
  try {
    return { ...JSON.parse(match[1]), parsed: true };
  } catch (e) {
    console.warn('[agentRouter] JSON parse failed:', e.message);
    return { status: 'ERROR', passed: 0, total: 0, failures: [], confidence: 'LOW', parsed: false };
  }
}
