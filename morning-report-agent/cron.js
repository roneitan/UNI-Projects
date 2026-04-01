'use strict';

require('dotenv').config();
const cron = require('node-cron');
const { collectResults } = require('./src/collectors/azureCollector');

// Phase 2 — uncomment when implemented:
// const { analyzeResults } = require('./src/agents/claudeAgent');
// const { sendReport }     = require('./src/reporters/slackReporter');

const TZ = process.env.TZ || 'UTC';

console.log(`[cron] Morning Report Agent starting. Timezone: ${TZ}`);
console.log('[cron] Scheduled: collect + analyze at 02:00, Slack report at 07:00');

// ── Job 1: 02:00 — Pull from Azure DevOps + run Claude analysis ───────────────
cron.schedule('0 2 * * *', async () => {
  const now = new Date();
  console.log(`\n[cron] 02:00 job started — ${now.toISOString()}`);
  try {
    const collected = await collectResults(now);
    console.log(`[cron] Collected results for ${collected.length} service(s).`);

    // Phase 2: pass collected results to Claude for analysis
    // await analyzeResults(collected, now);
    // console.log('[cron] Analysis complete. Reports written to ./reports/');
  } catch (err) {
    console.error('[cron] 02:00 job failed:', err);
    // TODO Phase 2: send a failure alert to Slack so the team knows the report will be missing
  }
}, { timezone: TZ });

// ── Job 2: 07:00 — Aggregate reports and send Slack morning message ───────────
cron.schedule('0 7 * * *', async () => {
  const now = new Date();
  console.log(`\n[cron] 07:00 job started — ${now.toISOString()}`);
  try {
    // Phase 2: read ./reports/YYYY-MM-DD/*.md and post to Slack
    // await sendReport(now);
    console.log('[cron] (Slack send not yet implemented — Phase 2)');
  } catch (err) {
    console.error('[cron] 07:00 job failed:', err);
  }
}, { timezone: TZ });
