#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const dbDir = path.resolve(__dirname, "..", "db");

const SOURCES = [
  {
    file: "GeoOpen-Country.mmdb",
    url: "https://cra.circl.lu/opendata/geo-open/mmdb-country/latest.mmdb",
  },
  {
    file: "GeoOpen-Country-ASN.mmdb",
    url: "https://cra.circl.lu/opendata/geo-open/mmdb-country-asn/latest.mmdb",
  },
];

function download(url, destPath, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) {
      reject(new Error(`Too many redirects for ${url}`));
      return;
    }
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          resolve(download(res.headers.location, destPath, redirects + 1));
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const total = Number(res.headers["content-length"] || 0);
        let received = 0;
        let lastPercent = -1;
        const tmpPath = `${destPath}.tmp`;
        const out = fs.createWriteStream(tmpPath);

        res.on("data", (chunk) => {
          received += chunk.length;
          if (total && process.stdout.isTTY) {
            const percent = Math.floor((received / total) * 100);
            if (percent !== lastPercent && percent % 5 === 0) {
              lastPercent = percent;
              process.stdout.write(
                `\r  ${path.basename(destPath)}  ${percent}%  ` +
                  `(${(received / 1024 / 1024).toFixed(1)} MB)`,
              );
            }
          }
        });

        res.pipe(out);
        out.on("finish", () => {
          out.close(() => {
            if (process.stdout.isTTY) process.stdout.write("\r");
            try {
              fs.renameSync(tmpPath, destPath);
            } catch (error) {
              reject(error);
              return;
            }
            const sizeMb = (fs.statSync(destPath).size / 1024 / 1024).toFixed(1);
            console.log(`  ${path.basename(destPath).padEnd(28)}  ${sizeMb} MB`);
            resolve();
          });
        });
        out.on("error", (error) => {
          fs.unlink(tmpPath, () => reject(error));
        });
      })
      .on("error", reject);
  });
}

async function main() {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("Downloading GeoIP databases (CIRCL open data)...");
  for (const { file, url } of SOURCES) {
    const dest = path.join(dbDir, file);
    try {
      await download(url, dest);
    } catch (error) {
      console.error(`\nFailed: ${file} - ${error.message}`);
      process.exit(1);
    }
  }
  console.log("Done.");
}

main();
