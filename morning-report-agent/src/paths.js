/**
 * Shared filesystem path constants for the morning-report-agent.
 *
 * Centralising these here means no file has to compute relative paths from
 * its own __dirname — a fragile pattern that breaks whenever files move.
 */
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Absolute path to the project root (one level above src/) */
const ROOT = resolve(__dirname, '..');

/** Raw test-result JSON written by azureCollector, one sub-dir per date */
export const RESULTS_DIR = resolve(ROOT, 'results');

/** Markdown + JSON analysis written by agentRouter, one sub-dir per date */
export const REPORTS_DIR = resolve(ROOT, 'reports');

/** Bare git clones maintained by gitSync */
export const REPOS_DIR = resolve(ROOT, 'repos');

/** Temporary git worktrees created for fix-branch runs */
export const WORKSPACES_DIR = resolve(ROOT, 'workspaces');
