import 'dotenv/config';
import cron from 'node-cron';
import { runAll } from './src/orchestrator/index.js';
import { send as sendTeamsReport } from './src/reporters/teamsReporter.js';

const TZ = process.env.TZ || 'UTC';

console.log(`[cron] Morning Report Agent starting — timezone: ${TZ}`);
console.log('[cron] Schedule: collect + analyze at 02:00, Teams report at 07:00');

// ── Job 1: 02:00 — Pull results from Azure + run Claude analysis ──────────────
cron.schedule('0 2 * * *', async () => {
  const now = new Date();
  console.log(`\n[cron] 02:00 job started — ${now.toISOString()}`);
  try {
    await runAll(now);
    console.log('[cron] 02:00 job complete');
  } catch (err) {
    console.error('[cron] 02:00 job failed:', err);
    // Alert the team so they know the 07:00 report will be missing or incomplete
    await sendTeamsReport(now, [{
      serviceId: 'system',
      displayName: 'Morning Report Agent',
      status: 'ERROR',
      passed: 0,
      total: 0,
      failures: [{ test: 'orchestrator', error: err.message, rootCause: err.message, fixed: false }],
      confidence: 'LOW',
      fixBranchUrl: null,
      prUrl: null,
    }]).catch(e => console.error('[cron] Failed to send error alert to Teams:', e.message));
  }
}, { timezone: TZ });

// ── Job 2: 07:00 — Aggregate reports and send Teams Adaptive Card ─────────────
cron.schedule('0 7 * * *', async () => {
  const now = new Date();
  console.log(`\n[cron] 07:00 job started — ${now.toISOString()}`);
  try {
    await sendTeamsReport(now);
    console.log('[cron] 07:00 job complete');
  } catch (err) {
    console.error('[cron] 07:00 job failed:', err);
  }
}, { timezone: TZ });

console.log('[cron] Waiting for scheduled jobs...');
