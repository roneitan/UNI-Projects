/**
 * Claude runner — uses @anthropic-ai/claude-agent-sdk (query()).
 *
 * Gives Claude the exact same tool set as Claude Code desktop:
 * Read, Glob, Grep (+ Write, Edit when createFixBranch is true).
 * Supports isolation: 'worktree' for read-only runs.
 */

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

/**
 * @param {string} prompt
 * @param {{ automation: string, service: string|null, useWorktreeIsolation: boolean }} repoPaths
 * @param {{ model: string|null, maxTurns: number, maxBudgetUsd: number, createFixBranch: boolean }} options
 * @returns {Promise<{ fullText: string, costUsd: number|null }>}
 */
export async function run(prompt, repoPaths, options) {
  const { query } = await import('@anthropic-ai/claude-agent-sdk');

  const model = options.model ?? DEFAULT_MODEL;
  const allowedTools = ['Read', 'Glob', 'Grep'];
  if (options.createFixBranch) allowedTools.push('Write', 'Edit');

  const queryOptions = {
    cwd: repoPaths.automation,
    additionalDirectories: repoPaths.service ? [repoPaths.service] : [],
    allowedTools,
    disallowedTools: ['Bash', 'WebFetch', 'WebSearch'],
    permissionMode: 'bypassPermissions',
    persistSession: false,
    model,
    maxTurns: options.maxTurns,
    maxBudgetUsd: options.maxBudgetUsd,
    mcpServers: buildMcpServers(options),
  };

  if (repoPaths.useWorktreeIsolation) {
    queryOptions.isolation = 'worktree';
  }

  console.log(`[claudeRunner] model: ${model}`);

  const textChunks = [];
  let costUsd = null;

  for await (const msg of query({ prompt, options: queryOptions })) {
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

  return { fullText: textChunks.join('\n'), costUsd };
}

function buildMcpServers(options) {
  if (!process.env.AZURE_DEVOPS_ORG_NAME || !process.env.ADO_MCP_AUTH_TOKEN) return {};
  return {
    'azure-devops': {
      command: 'npx',
      args: [
        '-y', '@azure-devops/mcp',
        process.env.AZURE_DEVOPS_ORG_NAME,
        '--authentication', 'envvar',
        '-d', 'pipelines', 'test-plans',
      ],
      env: { ADO_MCP_AUTH_TOKEN: process.env.ADO_MCP_AUTH_TOKEN },
    },
  };
}
