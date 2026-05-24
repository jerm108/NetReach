"use strict";

const { resolveTarget } = require("./dns");
const { tcpProbe, httpsProbe, httpProbe } = require("./probes");
const { lookupIp } = require("./geoip");

async function checkIp(domain, ip, geo, config) {
  const tasks = [
    config.probeTcp
      ? tcpProbe(ip, config.tcpPort, config.tcpTimeout).then((v) => ({ key: "tcp", v }))
      : Promise.resolve({ key: "tcp", v: null, skipped: true }),
    config.probeHttps
      ? httpsProbe(domain, ip, config.httpsTimeout).then((v) => ({ key: "https", v }))
      : Promise.resolve({ key: "https", v: { status: null, latency: null }, skipped: true }),
    config.probeHttp
      ? httpProbe(domain, ip, config.httpTimeout).then((v) => ({ key: "http", v }))
      : Promise.resolve({ key: "http", v: { status: null, latency: null }, skipped: true }),
  ];

  const results = await Promise.all(tasks);
  const tcp = results.find((r) => r.key === "tcp").v;
  const httpsRes = results.find((r) => r.key === "https").v;
  const httpRes = results.find((r) => r.key === "http").v;

  const latencies = [tcp, httpsRes.latency, httpRes.latency].filter(
    (n) => typeof n === "number",
  );
  const latency = latencies.length ? Math.min(...latencies) : null;

  const ok = tcp !== null || httpsRes.status !== null || httpRes.status !== null;
  const geoInfo = lookupIp(ip, geo.readers, geo.countryInfo);

  return {
    target: domain,
    ip,
    ...geoInfo,
    latency: latency ?? 9999,
    tcp,
    https: httpsRes.status,
    http: httpRes.status,
    status: ok ? "OK" : "FAIL",
  };
}

async function checkTarget(target, geo, config) {
  const ips = await resolveTarget(target);
  if (!ips.length) {
    return [{ target, ip: "-", status: "FAIL", latency: 9999 }];
  }
  return Promise.all(ips.map((ip) => checkIp(target, ip, geo, config)));
}

module.exports = { checkTarget };
