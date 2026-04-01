'use strict';

require('dotenv').config();
const fse = require('fs-extra');
const path = require('path');
const { format, subDays } = require('date-fns');

// TODO(Azure MCP): Once you confirm the exact MCP server package, install it and
// uncomment the imports below. The collector connects to the Azure DevOps MCP
// server as an MCP client over stdio transport.
//
// const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
// const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

/**
 * Spawn the Azure DevOps MCP server and return a connected MCP client.
 *
 * The server command is read from AZURE_DEVOPS_MCP_CMD in .env.
 * Auth credentials are passed to the server as environment variables so
 * that no secrets are ever hardcoded.
 *
 * @returns {Promise<import('@modelcontextprotocol/sdk/client/index.js').Client>}
 */
async function createMcpClient() {
  // TODO(Azure MCP): Uncomment and test once the MCP server package is confirmed.
  //
  // const [cmd, ...args] = process.env.AZURE_DEVOPS_MCP_CMD.split(' ');
  // const transport = new StdioClientTransport({
  //   command: cmd,
  //   args,
  //   env: {
  //     ...process.env,
  //     AZURE_DEVOPS_PAT:     process.env.AZURE_DEVOPS_PAT,
  //     AZURE_DEVOPS_ORG_URL: process.env.AZURE_DEVOPS_ORG_URL,
  //     AZURE_DEVOPS_PROJECT: process.env.AZURE_DEVOPS_PROJECT,
  //   },
  // });
  // const client = new Client({ name: 'morning-report-agent', version: '1.0.0' });
  // await client.connect(transport);
  // return client;

  // Stub until MCP wired up
  return null;
}

/**
 * Fetch test results from Azure DevOps for all services on a given date.
 *
 * Collects the *previous* calendar day's pipeline runs (the 02:00 job queries
 * yesterday). Writes each service result to:
 *   ./results/YYYY-MM-DD/<service-name>.json
 *
 * @param {Date} date - Usually `new Date()` called at 02:00 — we query yesterday.
 * @returns {Promise<Array<{ serviceName: string, results: object }>>}
 */
async function collectResults(date) {
  const yesterday = subDays(date, 1);
  const dateStr = format(yesterday, 'yyyy-MM-dd');
  const services = parseServices();

  console.log(`[azureCollector] Collecting results for ${dateStr} — services: ${services.join(', ')}`);

  const mcpClient = await createMcpClient();

  const collected = [];

  for (const serviceName of services) {
    console.log(`[azureCollector]   → Fetching: ${serviceName}`);
    try {
      const rawResults = await fetchServiceResults(serviceName, dateStr, mcpClient);

      const outDir = path.resolve(__dirname, '../../results', dateStr);
      const outFile = path.join(outDir, `${serviceName}.json`);
      await fse.ensureDir(outDir);
      await fse.writeJson(outFile, rawResults, { spaces: 2 });

      console.log(`[azureCollector]   ✓ Saved ${outFile}`);
      collected.push({ serviceName, results: rawResults });
    } catch (err) {
      console.error(`[azureCollector]   ✗ Failed for ${serviceName}:`, err.message);
      // Continue — one failing service must not block the others
    }
  }

  // TODO(Azure MCP): Close the MCP client connection after all fetches complete.
  // if (mcpClient) await mcpClient.close();

  return collected;
}

/**
 * Fetch results for one service (one pipeline definition) via the MCP client.
 *
 * @param {string} serviceName - Pipeline definition name in Azure DevOps
 * @param {string} dateStr     - 'YYYY-MM-DD' — the day to query
 * @param {object|null} mcpClient - Connected MCP client (null when stubbed)
 * @returns {Promise<object>}
 */
async function fetchServiceResults(serviceName, dateStr, mcpClient) {
  // TODO(Azure MCP): Replace stub with real MCP tool calls.
  //
  // The Azure DevOps MCP server exposes tools such as:
  //   - list_pipeline_runs  (filter by definition name + date range)
  //   - get_test_results    (for a specific run ID)
  //
  // Example sketch (confirm exact tool names from the MCP server's manifest):
  //
  // const runsResponse = await mcpClient.callTool('list_pipeline_runs', {
  //   organization: process.env.AZURE_DEVOPS_ORG_URL,
  //   project:      process.env.AZURE_DEVOPS_PROJECT,
  //   pipelineName: serviceName,
  //   minDate:      `${dateStr}T00:00:00Z`,
  //   maxDate:      `${dateStr}T23:59:59Z`,
  // });
  //
  // const runs = runsResponse.content ?? [];
  // const testResults = await Promise.all(
  //   runs.map(run =>
  //     mcpClient.callTool('get_test_results', {
  //       organization: process.env.AZURE_DEVOPS_ORG_URL,
  //       project:      process.env.AZURE_DEVOPS_PROJECT,
  //       runId:        run.id,
  //     })
  //   )
  // );
  //
  // return buildResultShape(serviceName, dateStr, runs, testResults);

  // ── STUB — returns empty data until MCP is wired ──────────────────────────
  console.log(`[azureCollector]     (stub) No real Azure call yet for "${serviceName}"`);
  return {
    collectedAt: new Date().toISOString(),
    service: serviceName,
    date: dateStr,
    runs: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
  };
}

/**
 * Read SERVICES env var into an array.
 * Falls back to ['placeholder-service'] so the loop always runs during dev/testing.
 */
function parseServices() {
  const raw = process.env.SERVICES || '';
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : ['placeholder-service'];
}

module.exports = { collectResults };
