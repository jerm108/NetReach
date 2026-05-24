"use strict";

const fs = require("node:fs");
const path = require("node:path");

const isSea = (() => {
  try {
    return require("node:sea").isSea();
  } catch {
    return false;
  }
})();

function resolveExternal(relPath) {
  const baseDir = isSea ? path.dirname(process.execPath) : path.resolve(__dirname, "..");
  return path.resolve(baseDir, relPath);
}

function readAssetBuffer(assetKey, fallbackPath) {
  if (isSea) {
    const sea = require("node:sea");
    try {
      return Buffer.from(sea.getRawAsset(assetKey));
    } catch {}
  }
  return fs.readFileSync(resolveExternal(fallbackPath));
}

function readAssetText(assetKey, fallbackPath) {
  if (isSea) {
    const sea = require("node:sea");
    try {
      return sea.getAsset(assetKey, "utf8");
    } catch {}
  }
  return fs.readFileSync(resolveExternal(fallbackPath), "utf8");
}

function readExternalText(absOrRelPath) {
  const resolved = path.isAbsolute(absOrRelPath)
    ? absOrRelPath
    : path.resolve(process.cwd(), absOrRelPath);
  return fs.readFileSync(resolved, "utf8");
}

module.exports = {
  isSea,
  readAssetBuffer,
  readAssetText,
  readExternalText,
  resolveExternal,
};
