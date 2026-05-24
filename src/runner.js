"use strict";

const fs = require("node:fs");
const path = require("node:path");
const pLimitModule = require("p-limit");

const { parseArgs } = require("./cli");
const { loadTargets } = require("./targets");
const { loadGeo } = require("./geoip");
const { checkTarget } = require("./checker");
const { renderTable, renderSummary, filterOk } = require("./display");
const banner = require("./banner");

const pLimit = pLimitModule.default || pLimitModule;

function writeOutput(results, config) {
  const ok = filterOk(results);
  const trimmed = Number.isFinite(config.topN) ? ok.slice(0, config.topN) : ok;

  if (config.jsonOnly) {
    process.stdout.write(JSON.stringify(trimmed, null, 2) + "\n");
    return;
  }

  const outPath = path.isAbsolute(config.output)
    ? config.output
    : path.resolve(process.cwd(), config.output);
  fs.writeFileSync(outPath, JSON.stringify(trimmed, null, 2));
}

async function run(argv = process.argv) {
  const { config, targetsPath } = parseArgs(argv);

  if (config.showBanner && !config.quiet) {
    banner.print();
  }

  const targets = loadTargets(targetsPath);
  if (targets.length === 0) {
    console.error("No targets to scan.");
    process.exitCode = 1;
    return;
  }

  const geo = loadGeo();
  const limit = pLimit(config.concurrency);

  if (!config.quiet) {
    console.log(
      `  Loaded ${targets.length} targets  |  concurrency=${config.concurrency}  ` +
        `|  probes=[${[
          config.probeTcp && "tcp",
          config.probeHttps && "https",
          config.probeHttp && "http",
        ]
          .filter(Boolean)
          .join(",")}]\n`,
    );
  }

  const state = {
    results: [],
    seenDomains: new Set(),
    total: targets.length,
    startTime: Date.now(),
  };

  const interval = config.quiet
    ? null
    : setInterval(() => renderTable(state, config), config.displayIntervalMs);

  await Promise.all(
    targets.map((target) =>
      limit(async () => {
        const rows = await checkTarget(target, geo, config);
        for (const row of rows) {
          state.results.push(row);
          state.seenDomains.add(row.target);
        }
      }),
    ),
  );

  if (interval) clearInterval(interval);
  if (!config.quiet) renderTable(state, config);

  writeOutput(state.results, config);

  if (!config.jsonOnly) {
    renderSummary(state, config.output);
  }
}

module.exports = { run };
