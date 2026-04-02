import { z } from 'zod';

export const RepoConfigSchema = z.object({
  /** Full Azure DevOps git URL, e.g. https://dev.azure.com/org/project/_git/repo */
  url: z.string().url(),
  branch: z.string().default('main'),
  /** Optional sub-path within the repo to use as the agent's working root */
  subPath: z.string().nullable().default(null),
});

export const ServiceSchema = z.object({
  /** Kebab-case identifier, used for file names and branch names */
  id: z.string().regex(/^[a-z0-9-]+$/, 'id must be kebab-case'),

  /** Human-readable name shown in the Teams report */
  displayName: z.string(),

  pipeline: z.object({
    /** Exact pipeline definition name in Azure DevOps */
    name: z.string(),
    /** null = use AZURE_DEVOPS_PROJECT env var */
    project: z.string().nullable().default(null),
  }),

  repos: z.object({
    /** C# automation / test repo — Claude opens this as the primary codebase */
    automation: RepoConfigSchema,
    /** Optional: service source repo — added as additionalDirectories */
    service: RepoConfigSchema.optional(),
  }),

  agent: z.object({
    /**
     * Which agent runner to use.
     * 'claude' → @anthropic-ai/claude-agent-sdk (requires ANTHROPIC_API_KEY)
     * 'openai' → openai SDK with function tools (requires OPENAI_API_KEY)
     */
    provider: z.enum(['claude', 'openai']).default('claude'),

    /**
     * Phase 1: plain string injected into the base prompt as service context.
     * Describe what the service does, what to pay attention to, known flakiness, etc.
     */
    prompt: z.string(),

    /**
     * Model name — interpreted by the chosen provider's runner.
     * Claude examples : 'claude-sonnet-4-20250514', 'claude-opus-4-6'
     * OpenAI examples : 'gpt-4o', 'o3', 'o4-mini', 'codex-1'
     * null → each runner applies its own default
     */
    model: z.string().nullable().default(null),

    /** Max agentic turns (tool-call round trips) before the agent stops */
    maxTurns: z.number().int().positive().default(15),

    /** Hard cost ceiling per service run in USD */
    maxBudgetUsd: z.number().positive().default(0.50),

    /**
     * When true: Claude gets Write + Edit tools and works in a dedicated fix branch
     * worktree. After the run, changes are committed and pushed, and a PR is opened.
     */
    createFixBranch: z.boolean().default(false),
  }),

  report: z.object({
    /** Alert in Teams if failure rate exceeds this fraction (0.0–1.0) */
    failureThreshold: z.number().min(0).max(1).default(0.05),
    /** Teams @mentions to include when this service fails */
    mentionOnFailure: z.array(z.string()).default([]),
  }).default({ failureThreshold: 0.05, mentionOnFailure: [] }),
});

/** @typedef {import('zod').infer<typeof ServiceSchema>} Service */
