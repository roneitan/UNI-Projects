import { describe, it, expect } from 'vitest';
import { buildAdaptiveCard } from '../../src/reporters/teamsReporter.js';

const PASSING = {
  serviceId: 'api-gateway',
  displayName: 'API Gateway',
  status: 'PASSED',
  passed: 120,
  total: 120,
  failures: [],
  confidence: 'HIGH',
  fixBranchUrl: null,
  prUrl: null,
};

const FAILING = {
  serviceId: 'auth-service',
  displayName: 'Auth Service',
  status: 'FAILED',
  passed: 44,
  total: 47,
  failures: [
    {
      test: 'Login_WithExpiredToken',
      file: 'JwtHandlerTests.cs',
      error: 'NullReferenceException',
      rootCause: 'Null check missing in JwtHandler.ValidateToken',
      suggestedFix: 'Add null guard before ValidateToken call',
      fixed: false,
    },
  ],
  confidence: 'HIGH',
  fixBranchUrl: 'https://dev.azure.com/org/proj/_git/auto?version=GBfix%2Fauth-service-2026-03-30',
  prUrl: 'https://dev.azure.com/org/proj/_git/auto/pullrequest/42',
};

const ERROR = {
  serviceId: 'data-pipeline',
  displayName: 'Data Pipeline',
  status: 'ERROR',
  passed: 0,
  total: 0,
  failures: [],
  confidence: 'LOW',
  fixBranchUrl: null,
  prUrl: null,
  error: 'Azure MCP connection timeout',
};

describe('buildAdaptiveCard', () => {
  it('has the correct schema and type', () => {
    const card = buildAdaptiveCard('2026-03-30', [PASSING]);
    expect(card.$schema).toContain('adaptivecards.io');
    expect(card.type).toBe('AdaptiveCard');
    expect(card.version).toBe('1.4');
  });

  it('includes the date in the title', () => {
    const card = buildAdaptiveCard('2026-03-30', [PASSING]);
    const title = card.body[0];
    expect(title.text).toContain('2026-03-30');
  });

  it('shows Good colour when all services pass', () => {
    const card = buildAdaptiveCard('2026-03-30', [PASSING]);
    const summary = card.body[1];
    expect(summary.color).toBe('Good');
    expect(summary.text).toContain('All 1 services passing');
  });

  it('shows Attention colour when services fail', () => {
    const card = buildAdaptiveCard('2026-03-30', [PASSING, FAILING]);
    const summary = card.body[1];
    expect(summary.color).toBe('Attention');
    expect(summary.text).toContain('1/2 passing');
  });

  it('includes a row for each service', () => {
    const card = buildAdaptiveCard('2026-03-30', [PASSING, FAILING, ERROR]);
    // body = [title, summary, separator, ...service rows, ...optionally top issues]
    const serviceRows = card.body.filter(b => b.type === 'ColumnSet');
    expect(serviceRows).toHaveLength(3);
  });

  it('adds a "Top Issues" section when failures exist', () => {
    const card = buildAdaptiveCard('2026-03-30', [PASSING, FAILING]);
    const hasTopIssues = card.body.some(b => b.text === 'Top Issues');
    expect(hasTopIssues).toBe(true);
  });

  it('does not add a "Top Issues" section when all pass', () => {
    const card = buildAdaptiveCard('2026-03-30', [PASSING]);
    const hasTopIssues = card.body.some(b => b.text === 'Top Issues');
    expect(hasTopIssues).toBe(false);
  });

  it('adds a PR action button when prUrl is present', () => {
    const card = buildAdaptiveCard('2026-03-30', [FAILING]);
    expect(card.actions).toBeDefined();
    const prAction = card.actions.find(a => a.url === FAILING.prUrl);
    expect(prAction).toBeDefined();
    expect(prAction.type).toBe('Action.OpenUrl');
  });

  it('adds a branch action button when fixBranchUrl is set but no prUrl', () => {
    const withBranchNopr = { ...FAILING, prUrl: null };
    const card = buildAdaptiveCard('2026-03-30', [withBranchNopr]);
    const branchAction = card.actions.find(a => a.url === FAILING.fixBranchUrl);
    expect(branchAction).toBeDefined();
    expect(branchAction.title).toContain('Fix Branch');
  });

  it('has no actions when there are no fix branches or PRs', () => {
    const card = buildAdaptiveCard('2026-03-30', [PASSING, ERROR]);
    expect(card.actions).toBeUndefined();
  });

  it('shows the 🔧 emoji in failure descriptions for fixed issues', () => {
    const withFix = {
      ...FAILING,
      failures: [{ ...FAILING.failures[0], fixed: true }],
    };
    const card = buildAdaptiveCard('2026-03-30', [withFix]);
    const issueBlocks = card.body.filter(
      b => b.type === 'TextBlock' && b.text?.startsWith('🔧'),
    );
    expect(issueBlocks.length).toBeGreaterThan(0);
  });
});
