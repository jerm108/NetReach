"use strict";

const dns = require("node:dns").promises;

const IPV4_RE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const cache = new Map();

function isRawIp(value) {
  return IPV4_RE.test(value);
}

async function resolveTarget(target) {
  if (cache.has(target)) return cache.get(target);

  if (isRawIp(target)) {
    cache.set(target, [target]);
    return [target];
  }

  try {
    const ips = await dns.resolve4(target);
    cache.set(target, ips);
    return ips;
  } catch {
    cache.set(target, []);
    return [];
  }
}

module.exports = { resolveTarget, isRawIp };
