"use strict";

const net = require("node:net");
const http = require("node:http");
const https = require("node:https");
const { isRawIp } = require("./dns");

function tcpProbe(ip, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const start = Date.now();
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeout);
    socket.once("connect", () => finish(Date.now() - start));
    socket.once("error", () => finish(null));
    socket.once("timeout", () => finish(null));

    try {
      socket.connect(port, ip);
    } catch {
      finish(null);
    }
  });
}

function makeRequestOptions(domain, ip, port) {
  const isIp = isRawIp(domain);
  const headers = isIp ? {} : { Host: domain };
  return {
    hostname: ip,
    port,
    path: "/",
    method: "HEAD",
    headers,
    servername: isIp ? undefined : domain,
    rejectUnauthorized: false,
    setHost: false,
  };
}

function httpRequest(client, options, timeout) {
  return new Promise((resolve) => {
    const start = Date.now();
    let settled = false;

    const finish = (value, latency) => {
      if (settled) return;
      settled = true;
      resolve(value === null ? { status: null, latency: null } : { status: value, latency });
    };

    const req = client.request({ ...options, timeout }, (res) => {
      finish(res.statusCode ?? null, Date.now() - start);
      res.resume();
    });

    req.once("error", () => finish(null));
    req.once("timeout", () => {
      req.destroy();
      finish(null);
    });

    req.end();
  });
}

function httpsProbe(domain, ip, timeout) {
  return httpRequest(https, makeRequestOptions(domain, ip, 443), timeout);
}

function httpProbe(domain, ip, timeout) {
  return httpRequest(http, makeRequestOptions(domain, ip, 80), timeout);
}

module.exports = { tcpProbe, httpsProbe, httpProbe };
