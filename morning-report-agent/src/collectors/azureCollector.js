import 'dotenv/config';
import fse from 'fs-extra';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { format, subDays } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Azure DevOps MCP tool names (confirmed from @azure-devops/mcp manifest) ──
// These are called by the Claude agent via the injected MCP server, not directly
// from this module. This file handles the pre-agent data collection only.
//
// mcp_ado_pipelines_get_builds           – filter by definition name + date range
// mcp_ado_pipelines_list_build_definitions – look up definition ID from name
// mcp_ado_testplan_show_test_results_from_build_id – test results per build

/**
 * Collect test results for a single service from Azure DevOps.
 *
 * The Claude agent receives the raw JSON here and can also call Azure DevOps
 * MCP tools itself during analysis for additional context.
 *
 * @param {import('../../services/base.schema.js').Service} service
 * @param {Date} date  - The date of the cron run; we query the previous calendar day
 * @returns {Promise<object>} Raw results object (also written to disk)
 */
export async function collectForService(service, date) {
  const yesterday = subDays(date, 1);
  const dateStr = format(yesterday, 'yyyy-MM-dd');
  const project = service.pipeline.project ?? process.env.AZURE_DEVOPS_PROJECT;

  console.log(`[azureCollector] Collecting ${service.id} — pipeline: "${service.pipeline.name}" — date: ${dateStr}`);

  // TODO(Azure MCP): Replace stub below with direct Azure DevOps REST API calls
  // to pre-fetch the test run summary before the Claude agent starts.
  //
  // Recommended approach using axios + ADO_MCP_AUTH_TOKEN:
  //
  //   const orgUrl = `https://dev.azure.com/${process.env.AZURE_DEVOPS_ORG_NAME}`;
  //   const auth = { username: '', password: process.env.ADO_MCP_AUTH_TOKEN };
  //
  //   Step 1 — get build definition ID by pipeline name:
  //   GET {orgUrl}/{project}/_apis/build/definitions?name={pipeline.name}&api-version=7.1
  //
  //   Step 2 — list builds for yesterday:
  //   GET {orgUrl}/{project}/_apis/build/builds
  //     ?definitions={definitionId}&minTime={dateStr}T00:00:00Z&maxTime={dateStr}T23:59:59Z
  //     &api-version=7.1
  //
  //   Step 3 — for each build, get test results:
  //   GET {orgUrl}/{project}/_apis/test/runs?buildId={buildId}&api-version=7.1
  //   GET {orgUrl}/{project}/_apis/test/runs/{runId}/results?api-version=7.1
  //
  // The Claude agent can then supplement this with MCP tool calls for deeper context.

  const rawResults = {
    collectedAt: new Date().toISOString(),
    serviceId: service.id,
    pipelineName: service.pipeline.name,
    project,
    date: dateStr,
    runs: [],                                          // TODO: fill from ADO API
    summary: { total: 0, passed: 0, failed: 0, skipped: 0 }, // TODO: fill from ADO API
  };

  const outDir = resolve(__dirname, '../../results', dateStr);
  const outFile = join(outDir, `${service.id}.json`);
  await fse.ensureDir(outDir);
  await fse.writeJson(outFile, rawResults, { spaces: 2 });

  console.log(`[azureCollector] Saved ${outFile}`);
  return rawResults;
}

/**
 * Collect results for all services (used by the cron job directly for a
 * full-night run outside of the orchestrator, e.g. `npm run collect`).
 *
 * @param {Date} date
 * @returns {Promise<Array<{ service: object, results: object }>>}
 */
export async function collectResults(date) {
  const { loadAll } = await import('../../services/registry.js');
  const services = await loadAll();

  const collected = [];
  for (const service of services) {
    try {
      const results = await collectForService(service, date);
      collected.push({ service, results });
    } catch (err) {
      console.error(`[azureCollector] Failed for ${service.id}:`, err.message);
    }
  }
  return collected;
}
