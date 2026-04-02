import { describe, it, expect } from 'vitest';
import { ServiceSchema } from '../../services/base.schema.js';

const VALID = {
  id: 'auth-service',
  displayName: 'Auth Service',
  pipeline: { name: 'auth-service-nightly', project: null },
  repos: {
    automation: {
      url: 'https://dev.azure.com/org/project/_git/automation-tests',
      branch: 'main',
      subPath: 'tests/AuthService',
    },
  },
  agent: {
    prompt: 'Handles JWT authentication.',
    model: 'claude-sonnet-4-20250514',
    maxTurns: 15,
    maxBudgetUsd: 0.5,
    createFixBranch: false,
  },
  report: { failureThreshold: 0.05, mentionOnFailure: [] },
};

describe('ServiceSchema validation', () => {
  it('accepts a fully valid config', () => {
    const result = ServiceSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  it('applies default values when optional fields are omitted', () => {
    const minimal = {
      id: 'my-service',
      displayName: 'My Service',
      pipeline: { name: 'my-nightly' },
      repos: {
        automation: { url: 'https://dev.azure.com/org/proj/_git/auto' },
      },
      agent: { prompt: 'Some context.' },
    };
    const result = ServiceSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    expect(result.data.agent.model).toBe('claude-sonnet-4-20250514');
    expect(result.data.agent.maxTurns).toBe(15);
    expect(result.data.agent.maxBudgetUsd).toBe(0.5);
    expect(result.data.agent.createFixBranch).toBe(false);
    expect(result.data.repos.automation.branch).toBe('main');
    expect(result.data.repos.automation.subPath).toBeNull();
    expect(result.data.pipeline.project).toBeNull();
    expect(result.data.report.failureThreshold).toBe(0.05);
    expect(result.data.report.mentionOnFailure).toEqual([]);
  });

  it('rejects a non-kebab-case id', () => {
    const result = ServiceSchema.safeParse({ ...VALID, id: 'Auth Service' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid automation repo URL', () => {
    const result = ServiceSchema.safeParse({
      ...VALID,
      repos: { automation: { url: 'not-a-url' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects maxBudgetUsd of zero', () => {
    const result = ServiceSchema.safeParse({
      ...VALID,
      agent: { ...VALID.agent, maxBudgetUsd: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects failureThreshold above 1', () => {
    const result = ServiceSchema.safeParse({
      ...VALID,
      report: { failureThreshold: 1.5, mentionOnFailure: [] },
    });
    expect(result.success).toBe(false);
  });

  it('accepts an optional service repo', () => {
    const withService = {
      ...VALID,
      repos: {
        ...VALID.repos,
        service: {
          url: 'https://dev.azure.com/org/project/_git/auth-service',
          branch: 'main',
          subPath: null,
        },
      },
    };
    const result = ServiceSchema.safeParse(withService);
    expect(result.success).toBe(true);
    expect(result.data.repos.service?.url).toContain('auth-service');
  });
});
