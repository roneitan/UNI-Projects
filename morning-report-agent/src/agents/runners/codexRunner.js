/**
 * OpenAI runner — uses the `openai` SDK with explicit function tools.
 *
 * Implements the same Read / Search / Write surface as the Claude runner
 * via OpenAI function-calling, so the agent can explore the repo and
 * optionally apply fixes.
 *
 * Compatible with: gpt-4o, gpt-4o-mini, o3, o4-mini, codex-1, and any
 * other model served through the OpenAI API that supports tool use.
 */

import OpenAI from 'openai';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve, join, relative } from 'path';

const DEFAULT_MODEL = 'gpt-4o';
// o-series models need slightly different params
const O_SERIES = new Set(['o1', 'o3', 'o3-mini', 'o4-mini', 'o1-mini', 'o1-preview']);

/**
 * @param {string} prompt
 * @param {{ automation: string, service: string|null }} repoPaths
 * @param {{ model: string|null, maxTurns: number, createFixBranch: boolean }} options
 * @returns {Promise<{ fullText: string, costUsd: number|null }>}
 */
export async function run(prompt, repoPaths, options) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = options.model ?? DEFAULT_MODEL;

  console.log(`[codexRunner] model: ${model}`);

  const tools = buildTools(repoPaths, options.createFixBranch);
  const messages = [{ role: 'user', content: prompt }];

  let fullText = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let turn = 0; turn < options.maxTurns; turn++) {
    const params = {
      model,
      messages,
      tools,
      tool_choice: 'auto',
    };

    // o-series models don't accept temperature or system role in the same way
    if (O_SERIES.has(model)) {
      delete params.tool_choice; // auto is default
    }

    const response = await client.chat.completions.create(params);
    const choice = response.choices[0];
    const message = choice.message;

    messages.push(message);

    if (message.content) fullText += message.content + '\n';

    if (response.usage) {
      totalInputTokens += response.usage.prompt_tokens ?? 0;
      totalOutputTokens += response.usage.completion_tokens ?? 0;
    }

    // No tool calls or model decided to stop
    if (!message.tool_calls?.length || choice.finish_reason === 'stop') break;

    // Execute each tool call and feed results back
    for (const toolCall of message.tool_calls) {
      const result = executeTool(toolCall, repoPaths);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  // OpenAI doesn't return cost directly — approximate from token counts
  const costUsd = estimateCost(model, totalInputTokens, totalOutputTokens);

  return { fullText: fullText.trim(), costUsd };
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

function buildTools(repoPaths, createFixBranch) {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Read the full contents of a file in the repository.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path relative to the repo root.' },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_directory',
        description: 'List files and sub-directories at a given path.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path relative to repo root. Use "." for the root.' },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_files',
        description: 'Search for a text pattern across files (like grep). Returns matching file paths.',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Text or regex pattern to search for.' },
            directory: { type: 'string', description: 'Subdirectory to search in (relative). Defaults to repo root.' },
            file_pattern: { type: 'string', description: 'File glob to restrict search, e.g. "*.cs". Defaults to all files.' },
          },
          required: ['pattern'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'find_files',
        description: 'Find files by name pattern recursively in the repository.',
        parameters: {
          type: 'object',
          properties: {
            name_pattern: { type: 'string', description: 'Filename pattern, e.g. "*Tests.cs" or "*.csproj".' },
            directory: { type: 'string', description: 'Directory to search in (relative). Defaults to repo root.' },
          },
          required: ['name_pattern'],
        },
      },
    },
  ];

  if (createFixBranch) {
    tools.push({
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Write content to a file (creates or overwrites). Use only to apply fixes.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path relative to repo root.' },
            content: { type: 'string', description: 'New file content.' },
          },
          required: ['path', 'content'],
        },
      },
    });
  }

  return tools;
}

// ─── Tool execution ───────────────────────────────────────────────────────────

function executeTool(toolCall, repoPaths) {
  const { name } = toolCall.function;
  let args;
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch {
    return 'Error: could not parse tool arguments';
  }

  const base = repoPaths.automation;

  try {
    switch (name) {
      case 'read_file': {
        const full = safePath(base, args.path);
        if (!full) return 'Error: path is outside the repository';
        return readFileSync(full, 'utf-8');
      }

      case 'list_directory': {
        const dir = safePath(base, args.path ?? '.');
        if (!dir) return 'Error: path is outside the repository';
        const entries = readdirSync(dir);
        return entries
          .map(e => {
            try {
              return statSync(join(dir, e)).isDirectory() ? `${e}/` : e;
            } catch { return e; }
          })
          .join('\n');
      }

      case 'search_files': {
        const searchDir = safePath(base, args.directory ?? '.');
        if (!searchDir) return 'Error: path is outside the repository';
        const grepArgs = ['-r', '-l', args.pattern, searchDir];
        if (args.file_pattern) grepArgs.push('--include', args.file_pattern);
        try {
          const out = execFileSync('grep', grepArgs, { encoding: 'utf-8', maxBuffer: 2 * 1024 * 1024 });
          // Return relative paths for readability
          return out.trim().split('\n').map(p => relative(base, p)).join('\n') || 'No matches';
        } catch (e) {
          return e.stdout?.trim() || 'No matches found';
        }
      }

      case 'find_files': {
        const searchDir = safePath(base, args.directory ?? '.');
        if (!searchDir) return 'Error: path is outside the repository';
        try {
          const out = execFileSync(
            'find', [searchDir, '-name', args.name_pattern, '-type', 'f'],
            { encoding: 'utf-8', maxBuffer: 2 * 1024 * 1024 },
          );
          return out.trim().split('\n').map(p => relative(base, p)).join('\n') || 'No files found';
        } catch {
          return 'No files found';
        }
      }

      case 'write_file': {
        const full = safePath(base, args.path);
        if (!full) return 'Error: path is outside the repository';
        writeFileSync(full, args.content, 'utf-8');
        return `Written: ${args.path}`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error executing ${name}: ${err.message}`;
  }
}

/**
 * Resolve a user-supplied path relative to `base` and verify it stays inside.
 * Returns null if the resolved path escapes the base directory.
 */
function safePath(base, userPath) {
  const resolved = resolve(base, userPath);
  return resolved.startsWith(base) ? resolved : null;
}

// ─── Cost estimation ──────────────────────────────────────────────────────────

// Approximate pricing per 1M tokens (input / output) as of early 2026
const PRICING = {
  'gpt-4o':        [2.50,  10.00],
  'gpt-4o-mini':   [0.15,   0.60],
  'o3':            [10.00,  40.00],
  'o3-mini':       [1.10,   4.40],
  'o4-mini':       [1.10,   4.40],
  'codex-1':       [3.00,  12.00],
};

function estimateCost(model, inputTokens, outputTokens) {
  const [inputRate, outputRate] = PRICING[model] ?? [5.00, 15.00];
  return (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
}
