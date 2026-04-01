import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fse from 'fs-extra';
import { format } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_PROMPT = readFileSync(join(__dirname, 'prompts/base-analysis.md'), 'utf-8');

/**
 * Run a Claude Code agent to analyse test failures for a single service.
 *
 * When service.agent.createFixBranch is false:
 *   - Tools: Read, Glob, Grep (read-only)
 *   - isolation: 'worktree' — SDK creates a temporary worktree, discards after
 *
 * When service.agent.createFixBranch is true:
 *   - Tools: Read, Glob, Grep, Write, Edit
 *   - cwd is the fix-branch worktree we created in gitSync
 *   - No SDK isolation (we own the worktree lifecycle)
 *
 * @param {import('../../services/base.schema.js').Service} service
 * @param {object} testResults   - Raw JSON from azureCollector
 * @param {{ automation: string, service: string|null, useWorktreeIsolation: boolean }} repoPaths
 * @param {Date} date
 * @returns {Promise<object>} Parsed structured result from the agent
 */
export async function analyze(service, testResults, repoPaths, date) {
  // Dynamic import — @anthropic-ai/claude-agent-sdk is ESM
  const { query } = await import('@anthropic-ai/claude-agent-sdk');

  const dateStr = format(date, 'yyyy-MM-dd');
  const prompt = buildPrompt(service, testResults);

  const allowedTools = ['Read', 'Glob', 'Grep'];
  if (service.agent.createFixBranch) {
    allowedTools.push('Write', 'Edit');
  }

  const options = {
    cwd: repoPaths.automation,
    additionalDirectories: repoPaths.service ? [repoPaths.service] : [],
    allowedTools,
    disallowedTools: ['Bash', 'WebFetch', 'WebSearch'],
    permissionMode: 'bypassPermissions',
    persistSession: false,
    model: service.agent.model,
    maxTurns: service.agent.maxTurns,
    maxBudgetUsd: service.agent.maxBudgetUsd,
    mcpServers: {
      'azure-devops': {
        command: 'npx',
        args: [
          '-y', '@azure-devops/mcp',
          process.env.AZURE_DEVOPS_ORG_NAME,
          '--authentication', 'envvar',
          // Load only the domains we need — reduces startup time
          '-d', 'pipelines', 'test-plans',
        ],
        env: { ADO_MCP_AUTH_TOKEN: process.env.ADO_MCP_AUTH_TOKEN },
      },
    },
  };

  // Only ask the SDK to manage worktree isolation for read-only runs.
  // For fix-branch runs we already have our own worktree as `cwd`.
  if (repoPaths.useWorktreeIsolation) {
    options.isolation = 'worktree';
  }

  console.log(`[claudeAgent] Starting analysis: ${service.displayName} (${service.agent.model})`);

  const textChunks = [];
  let costUsd = null;

  for await (const msg of query({ prompt, options })) {
    if (msg.type === 'assistant') {
      const text = msg.message?.content
        ?.filter(c => c.type === 'text')
        .map(c => c.text)
        .join('') ?? '';
      if (text) textChunks.push(text);
    }
    if (msg.type === 'result') {
      costUsd = msg.total_cost_usd ?? null;
    }
  }

  const fullText = textChunks.join('\n');
  const structured = extractJson(fullText);

  // ── Persist results ─────────────────────────────────────────────────────────
  const reportsDir = resolve(__dirname, '../../reports', dateStr);
  await fse.ensureDir(reportsDir);

  // Full markdown analysis
  await fse.writeFile(join(reportsDir, `${service.id}.md`), fullText);

  // Structured JSON sidecar — consumed by teamsReporter
  const sidecar = {
    ...structured,
    serviceId: service.id,
    displayName: service.displayName,
    costUsd,
    generatedAt: new Date().toISOString(),
  };
  await fse.writeJson(join(reportsDir, `${service.id}.json`), sidecar, { spaces: 2 });

  if (costUsd !== null) {
    console.log(`[claudeAgent] Done: ${service.displayName} — ${structured.status} — $${costUsd.toFixed(4)}`);
  } else {
    console.log(`[claudeAgent] Done: ${service.displayName} — ${structured.status}`);
  }

  return structured;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(service, testResults) {
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

function extractJson(text) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```(?=[^`]|$)/);
  if (!match) {
    console.warn('[claudeAgent] No JSON block found in agent output — using fallback');
    return { status: 'ERROR', passed: 0, total: 0, failures: [], confidence: 'LOW', parsed: false };
  }
  try {
    return { ...JSON.parse(match[1]), parsed: true };
  } catch (e) {
    console.warn('[claudeAgent] JSON parse failed:', e.message);
    return { status: 'ERROR', passed: 0, total: 0, failures: [], confidence: 'LOW', parsed: false };
  }
}
