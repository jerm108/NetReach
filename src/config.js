"use strict";

const DEFAULTS = Object.freeze({
  concurrency: 200,
  tcpTimeout: 5000,
  httpsTimeout: 8000,
  httpTimeout: 8000,
  tcpPort: 443,
  httpPort: 80,
  httpsPort: 443,
  displayIntervalMs: 5000,
  previewLimit: 50,
  topN: Infinity,
  output: "result.json",
  probeTcp: true,
  probeHttps: true,
  probeHttp: true,
  quiet: false,
  jsonOnly: false,
  showBanner: true,
});

module.exports = { DEFAULTS };
