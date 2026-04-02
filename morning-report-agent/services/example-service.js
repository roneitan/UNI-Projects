/**
 * Example service config — copy this file and fill in your real values.
 *
 * File name becomes part of the load order but doesn't affect behaviour.
 * Use kebab-case that matches the `id` field.
 */

/** @type {import('./base.schema.js').Service} */
export default {
  id: 'example-service',
  displayName: 'Example Service',

  pipeline: {
    // Exact name of the nightly pipeline in Azure DevOps Pipelines
    name: 'example-service-nightly',
    // null = use AZURE_DEVOPS_PROJECT from .env
    project: null,
  },

  repos: {
    automation: {
      url: 'https://dev.azure.com/your-org/your-project/_git/automation-tests',
      branch: 'main',
      // Narrow Claude's working root to the tests for this service only
      subPath: 'tests/ExampleService',
    },
    // Optional: give Claude read access to the real service source too
    service: {
      url: 'https://dev.azure.com/your-org/your-project/_git/example-service',
      branch: 'main',
      subPath: null,
    },
  },

  agent: {
    // 'claude' (default) or 'openai'
    provider: 'claude',

    // Describe the service so the agent has context when analysing failures.
    // Mention known flakiness, critical test areas, team conventions, etc.
    prompt: `This service handles [describe what it does].
Pay special attention to [important test areas].
Known flaky tests: [list any if applicable].`,

    // null = runner picks its own default:
    //   claude provider → claude-sonnet-4-20250514
    //   openai provider → gpt-4o
    model: null,
    maxTurns: 15,
    maxBudgetUsd: 0.50,

    // Set to true to let the agent write fixes and open a PR automatically
    createFixBranch: false,
  },

  report: {
    failureThreshold: 0.05,
    mentionOnFailure: [],
  },
};
