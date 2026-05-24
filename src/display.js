"use strict";

function compareByLatency(a, b) {
  return (a.latency ?? 9999) - (b.latency ?? 9999);
}

function filterOk(results) {
  return results.filter((r) => r.status === "OK").sort(compareByLatency);
}

function shortStatus(value) {
  return value === null || value === undefined ? "-" : value;
}

function renderTable(state, config) {
  if (config.quiet) return;

  const { results, seenDomains, total, startTime } = state;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const ok = filterOk(results);

  console.clear();
  console.log(
    `[${new Date().toLocaleTimeString()}]` +
      `  Domains: ${seenDomains.size}/${total}` +
      `  |  IPs: ${results.length}` +
      `  |  OK: ${ok.length}` +
      `  |  FAIL: ${results.length - ok.length}` +
      `  |  Elapsed: ${elapsed}s\n`,
  );

  if (ok.length === 0) {
    console.log("  No reachable IPs yet...");
    return;
  }

  const limit = Math.min(ok.length, config.previewLimit);
  const preview = ok.slice(0, limit);

  console.table(
    preview.map((row) => ({
      target: row.target,
      ip: row.ip,
      cc: row.country,
      asn: row.as_organization,
      ms: row.latency,
      tcp: shortStatus(row.tcp),
      https: shortStatus(row.https),
      http: shortStatus(row.http),
    })),
  );

  if (ok.length > limit) {
    console.log(
      `\n  ... and ${ok.length - limit} more reachable IPs (showing top ${limit} by latency)`,
    );
  }
}

function renderSummary(state, output) {
  const ok = filterOk(state.results);
  console.log(
    `\nDone. ${ok.length} reachable IPs across ${state.seenDomains.size} domains -> ${output}`,
  );
}

module.exports = { renderTable, renderSummary, filterOk };
