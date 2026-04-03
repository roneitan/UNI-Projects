/**
 * Runner registry — maps provider name → run() function.
 *
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  HOW TO ADD A NEW PROVIDER (e.g. 'gemini', 'mistral', 'gpt-5')  ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║  1. Create src/agents/runners/<name>Runner.js                    ║
 * ║     It must export one function with this exact signature:        ║
 * ║       run(prompt, repoPaths, options)                            ║
 * ║         → Promise<{ fullText: string, costUsd: number|null }>    ║
 * ║                                                                  ║
 * ║  2. Add one line below:                                          ║
 * ║       import { run as <name>Run } from './<name>Runner.js';      ║
 * ║     and one entry in RUNNERS:                                    ║
 * ║       <name>: <name>Run,                                         ║
 * ║                                                                  ║
 * ║  3. Add '<name>' to the provider enum in                         ║
 * ║       services/base.schema.js  →  z.enum([..., '<name>'])        ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * repoPaths shape:
 *   { automation: string, service: string|null, useWorktreeIsolation: boolean }
 *
 * options shape:
 *   { model: string|null, maxTurns: number, maxBudgetUsd: number, createFixBranch: boolean }
 */

import { run as claudeRun } from './claudeRunner.js';
import { run as codexRun }  from './codexRunner.js';

export const RUNNERS = {
  claude: claudeRun,
  openai: codexRun,
};

/**
 * Look up a runner by provider name.
 * Throws a descriptive error if the provider is not registered — catches
 * typos and unsupported values before they reach the agent loop.
 *
 * @param {string} provider
 * @returns {Function} run(prompt, repoPaths, options) → Promise<{fullText, costUsd}>
 */
export function getRunner(provider) {
  const fn = RUNNERS[provider];
  if (!fn) {
    const known = Object.keys(RUNNERS).join(', ');
    throw new Error(
      `Unknown agent provider: "${provider}". Registered providers: ${known}`
    );
  }
  return fn;
}
