import pLimit from 'p-limit';
import { loadAll } from '../../services/registry.js';
import { runService } from './runService.js';

/**
 * Run all registered services in parallel, capped by MAX_CONCURRENT_AGENTS.
 *
 * Individual service failures are caught and returned as ERROR results so a
 * single broken service never prevents the rest from running or the Teams
 * report from being sent.
 *
 * @param {Date} date
 * @returns {Promise<import('./runService.js').ServiceResult[]>}
 */
export async function runAll(date) {
  const services = await loadAll();

  if (services.length === 0) {
    console.warn('[orchestrator] No services configured — nothing to run.');
    return [];
  }

  const concurrency = Math.max(1, parseInt(process.env.MAX_CONCURRENT_AGENTS ?? '3', 10));
  const limit = pLimit(concurrency);

  console.log(
    `[orchestrator] Running ${services.length} service(s) — concurrency: ${concurrency}`,
  );

  const results = await Promise.all(
    services.map(service =>
      limit(() =>
        runService(service, date).catch(err => {
          console.error(`[orchestrator] ${service.id} failed:`, err.message);
          return {
            serviceId: service.id,
            displayName: service.displayName,
            status: 'ERROR',
            passed: 0,
            total: 0,
            failures: [],
            confidence: 'LOW',
            fixBranchUrl: null,
            prUrl: null,
            error: err.message,
          };
        }),
      ),
    ),
  );

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;

  console.log(
    `[orchestrator] Complete — ✅ ${passed} passed  ❌ ${failed} failed  ⚠️ ${errors} errors`,
  );

  return results;
}
