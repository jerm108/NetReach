#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const SEA_FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const bundlePath = path.join(distDir, "bundle.cjs");
const blobPath = path.join(distDir, "sea-prep.blob");
const seaConfigPath = path.join(distDir, "sea-config.json");

const platform = process.platform;
const arch = process.arch;
const exeExt = platform === "win32" ? ".exe" : "";
const binaryName = `netreach-${platform}-${arch}${exeExt}`;
const executablePath = path.join(distDir, binaryName);

const MIN_MAJOR = 20;
const MIN_MINOR_FOR_20 = 12;

function hasSEAFuse(nodePath) {
  try {
    const buf = fs.readFileSync(nodePath);
    return buf.indexOf(Buffer.from(SEA_FUSE)) !== -1;
  } catch {
    return false;
  }
}

function nodeVersion(nodePath) {
  try {
    const result = spawnSync(nodePath, ["-v"], { encoding: "utf8" });
    const match = /v(\d+)\.(\d+)\.(\d+)/.exec(result.stdout || "");
    if (!match) return null;
    return {
      major: Number(match[1]),
      minor: Number(match[2]),
      patch: Number(match[3]),
      raw: match[0],
    };
  } catch {
    return null;
  }
}

function meetsMinimum(v) {
  if (!v) return false;
  if (v.major < MIN_MAJOR) return false;
  if (v.major === MIN_MAJOR && v.minor < MIN_MINOR_FOR_20) return false;
  return true;
}

function compareVersions(a, b) {
  if (a.major !== b.major) return b.major - a.major;
  if (a.minor !== b.minor) return b.minor - a.minor;
  return b.patch - a.patch;
}

function gatherCandidates() {
  const whichCmd = platform === "win32" ? "where" : "which";
  const args = platform === "win32" ? ["node"] : ["-a", "node"];
  const result = spawnSync(whichCmd, args, { encoding: "utf8" });
  const fromPath = (result.stdout || "").split(/\r?\n/).filter(Boolean);

  const home = process.env.HOME || process.env.USERPROFILE || "";
  const extra = [];
  for (const base of [
    path.join(home, ".nvm", "versions", "node"),
    path.join(home, ".fnm", "node-versions"),
    path.join(home, ".volta", "tools", "image", "node"),
  ]) {
    try {
      for (const entry of fs.readdirSync(base)) {
        const candidates = [
          path.join(base, entry, "bin", "node"),
          path.join(base, entry, "installation", "bin", "node"),
        ];
        for (const c of candidates) {
          try {
            if (fs.statSync(c).isFile()) extra.push(c);
          } catch {}
        }
      }
    } catch {}
  }

  const seen = new Set();
  const all = [process.execPath, ...fromPath, ...extra].filter((p) => {
    try {
      const real = fs.realpathSync(p);
      if (seen.has(real)) return false;
      seen.add(real);
      return true;
    } catch {
      return false;
    }
  });
  return all;
}

function findSEANode() {
  const envNode = process.env.NODE_SEA_EXECUTABLE;
  if (envNode) {
    if (!hasSEAFuse(envNode)) {
      console.error(`NODE_SEA_EXECUTABLE="${envNode}" lacks the SEA fuse sentinel.`);
      process.exit(1);
    }
    const v = nodeVersion(envNode);
    if (!meetsMinimum(v)) {
      console.error(
        `NODE_SEA_EXECUTABLE="${envNode}" is ${v ? v.raw : "unknown"}, need >= v20.12.`,
      );
      process.exit(1);
    }
    return envNode;
  }

  const candidates = gatherCandidates();
  const eligible = [];
  for (const c of candidates) {
    if (!hasSEAFuse(c)) continue;
    const v = nodeVersion(c);
    if (!meetsMinimum(v)) continue;
    eligible.push({ path: c, version: v });
  }
  eligible.sort((a, b) => compareVersions(a.version, b.version));

  if (eligible.length) return eligible[0].path;

  console.error(`
ERROR: No Node.js >= v20.12 with the SEA fuse was found.

The SEA fuse is missing from Homebrew builds. Install an official build via
nvm/fnm/volta (https://nodejs.org/dist/) and re-run, or set NODE_SEA_EXECUTABLE
explicitly:

  nvm install 22 && nvm use 22
  pnpm build

  # or
  NODE_SEA_EXECUTABLE=/path/to/official/node pnpm build
`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function ensureCleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
}

function bundle() {
  const nccBin = path.join(
    rootDir,
    "node_modules",
    ".bin",
    platform === "win32" ? "ncc.cmd" : "ncc",
  );
  run(nccBin, ["build", "index.js", "-o", "dist", "-m", "--target", "es2022"]);
  fs.renameSync(path.join(distDir, "index.js"), bundlePath);
}

function writeSeaConfig() {
  const seaConfig = {
    main: bundlePath,
    output: blobPath,
    disableExperimentalSEAWarning: true,
    useCodeCache: false,
    useSnapshot: false,
    assets: {
      "targets.txt": path.join(rootDir, "targets.txt"),
      "db/country.json": path.join(rootDir, "db", "country.json"),
      "db/GeoOpen-Country.mmdb": path.join(rootDir, "db", "GeoOpen-Country.mmdb"),
      "db/GeoOpen-Country-ASN.mmdb": path.join(
        rootDir,
        "db",
        "GeoOpen-Country-ASN.mmdb",
      ),
    },
  };
  fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
}

function buildBlob(seaNode) {
  run(seaNode, ["--experimental-sea-config", seaConfigPath], { cwd: distDir });
}

function copyBaseBinary(seaNode) {
  fs.copyFileSync(seaNode, executablePath);
  if (platform !== "win32") {
    fs.chmodSync(executablePath, 0o755);
  }
}

function maybeStripSignature() {
  if (platform === "darwin") {
    run("codesign", ["--remove-signature", executablePath]);
  } else if (platform === "win32") {
    const signtoolCheck = spawnSync("where", ["signtool"], { encoding: "utf8" });
    if (signtoolCheck.status === 0) {
      spawnSync("signtool", ["remove", "/s", executablePath], {
        stdio: "ignore",
        shell: true,
      });
    }
  }
}

function injectBlob() {
  const postjectBin = path.join(
    rootDir,
    "node_modules",
    ".bin",
    platform === "win32" ? "postject.cmd" : "postject",
  );
  const args = [executablePath, "NODE_SEA_BLOB", blobPath, "--sentinel-fuse", SEA_FUSE];
  if (platform === "darwin") {
    args.push("--macho-segment-name", "NODE_SEA");
  }
  run(postjectBin, args);
}

function maybeReSign() {
  if (platform === "darwin") {
    run("codesign", ["--sign", "-", executablePath]);
  }
}

function cleanupArtifacts() {
  for (const p of [bundlePath, blobPath, seaConfigPath]) {
    try {
      fs.rmSync(p, { force: true });
    } catch {}
  }
  try {
    fs.rmSync(path.join(distDir, "bundle.cjs.map"), { force: true });
  } catch {}
}

function ensureDatabases() {
  const required = [
    path.join(rootDir, "db", "GeoOpen-Country.mmdb"),
    path.join(rootDir, "db", "GeoOpen-Country-ASN.mmdb"),
    path.join(rootDir, "db", "country.json"),
  ];
  const missing = required.filter((p) => !fs.existsSync(p));
  if (missing.length === 0) return;

  if (missing.some((p) => p.endsWith("country.json"))) {
    console.error(
      `\nERROR: Missing db/country.json (must be committed in the repo).\n`,
    );
    process.exit(1);
  }

  console.log("GeoIP databases missing - downloading fresh copies...");
  const downloader = path.join(rootDir, "scripts", "download-db.js");
  run(process.execPath, [downloader]);
}

function main() {
  console.log(`Building SEA: ${platform}-${arch} -> ${binaryName}`);
  ensureDatabases();
  const seaNode = findSEANode();
  console.log(`SEA base binary: ${seaNode}`);

  ensureCleanDist();
  bundle();
  writeSeaConfig();
  buildBlob(seaNode);
  copyBaseBinary(seaNode);
  maybeStripSignature();
  injectBlob();
  maybeReSign();
  cleanupArtifacts();

  const stat = fs.statSync(executablePath);
  console.log(
    `\nDone: ${executablePath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`,
  );
}

main();
