import axios from 'axios';
import { format, subDays } from 'date-fns';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Send the morning Teams report.
 *
 * `results` can be passed directly (when called immediately after runAll) or
 * omitted to have the reporter read the JSON sidecars written to disk during
 * the 02:00 analysis run — this is the normal 07:00 flow.
 *
 * @param {Date} date
 * @param {import('../orchestrator/runService.js').ServiceResult[]} [results]
 */
export async function send(date, results = null) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[teamsReporter] TEAMS_WEBHOOK_URL not set — skipping Teams post');
    return;
  }

  const dateStr = format(subDays(date, 1), 'yyyy-MM-dd');
  const data = results ?? (await loadFromDisk(dateStr));

  if (data.length === 0) {
    console.warn(`[teamsReporter] No report data found for ${dateStr} — skipping`);
    return;
  }

  const card = buildAdaptiveCard(dateStr, data);

  await axios.post(
    webhookUrl,
    { type: 'message', attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', content: card }] },
    { headers: { 'Content-Type': 'application/json' } },
  );

  console.log(`[teamsReporter] Report sent for ${dateStr} (${data.length} service(s))`);
}

// ─── Adaptive Card builder ────────────────────────────────────────────────────

function buildAdaptiveCard(dateStr, results) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const errors = results.filter(r => r.status === 'ERROR').length;

  const summaryColour = failed + errors === 0 ? 'Good' : failed > 0 ? 'Attention' : 'Warning';
  const summaryText = failed + errors === 0
    ? `All ${total} services passing`
    : `${passed}/${total} passing — ${failed} failed${errors ? `, ${errors} errors` : ''}`;

  const body = [
    {
      type: 'TextBlock',
      text: `Morning Test Report — ${dateStr}`,
      size: 'Large',
      weight: 'Bolder',
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: summaryText,
      color: summaryColour,
      spacing: 'None',
    },
    { type: 'separator' },
    ...results.map(serviceRow),
  ];

  // Top failure reasons (up to 5)
  const topFailures = results
    .filter(r => r.status !== 'PASSED')
    .flatMap(r =>
      (r.failures ?? []).slice(0, 2).map(f => ({
        service: r.displayName,
        cause: f.rootCause ?? f.error ?? 'Unknown error',
        fixed: f.fixed ?? false,
      })),
    )
    .slice(0, 5);

  if (topFailures.length > 0) {
    body.push({ type: 'TextBlock', text: 'Top Issues', weight: 'Bolder', spacing: 'Medium' });
    topFailures.forEach(({ service, cause, fixed }) =>
      body.push({
        type: 'TextBlock',
        text: `${fixed ? '🔧 ' : ''}**${service}:** ${cause}`,
        wrap: true,
        size: 'Small',
        spacing: 'None',
      }),
    );
  }

  // Actions — one "View PR" button per service that has a PR
  const actions = results
    .filter(r => r.prUrl)
    .map(r => ({
      type: 'Action.OpenUrl',
      title: `View ${r.displayName} PR`,
      url: r.prUrl,
    }));

  // Fallback "View Branch" for fix branches without PRs
  results
    .filter(r => r.fixBranchUrl && !r.prUrl)
    .forEach(r =>
      actions.push({
        type: 'Action.OpenUrl',
        title: `View ${r.displayName} Fix Branch`,
        url: r.fixBranchUrl,
      }),
    );

  return {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    body,
    ...(actions.length > 0 ? { actions } : {}),
  };
}

function serviceRow(r) {
  const icon = r.status === 'PASSED' ? '✅' : r.status === 'ERROR' ? '⚠️' : '❌';
  const countText = r.total > 0 ? `${r.passed}/${r.total}` : '—';
  const fixIcon = r.prUrl ? ' 🔧' : r.fixBranchUrl ? ' 🌿' : '';

  return {
    type: 'ColumnSet',
    spacing: 'Small',
    columns: [
      {
        type: 'Column',
        width: 'auto',
        items: [{ type: 'TextBlock', text: icon, size: 'Medium' }],
      },
      {
        type: 'Column',
        width: 'stretch',
        items: [{ type: 'TextBlock', text: `${r.displayName}${fixIcon}`, wrap: true }],
      },
      {
        type: 'Column',
        width: 'auto',
        items: [{
          type: 'TextBlock',
          text: countText,
          color: r.status === 'PASSED' ? 'Good' : 'Attention',
          horizontalAlignment: 'Right',
        }],
      },
    ],
  };
}

// ─── Disk reader for 07:00 job ────────────────────────────────────────────────

async function loadFromDisk(dateStr) {
  const reportsDir = resolve(__dirname, '../../reports', dateStr);
  if (!await fse.pathExists(reportsDir)) {
    console.warn(`[teamsReporter] Reports directory not found: ${reportsDir}`);
    return [];
  }

  const files = (await fse.readdir(reportsDir)).filter(f => f.endsWith('.json'));
  if (files.length === 0) return [];

  return Promise.all(
    files.map(f => fse.readJson(join(reportsDir, f))),
  );
}
