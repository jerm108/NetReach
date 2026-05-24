"use strict";

const { readAssetText, readExternalText } = require("./assets");

function parseTargets(raw) {
  const targets = [];
  for (const line of raw.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#")) continue;
    targets.push(clean);
  }
  return [...new Set(targets)];
}

function loadTargets(customPath) {
  const raw = customPath
    ? readExternalText(customPath)
    : readAssetText("targets.txt", "targets.txt");
  return parseTargets(raw);
}

module.exports = { loadTargets, parseTargets };
