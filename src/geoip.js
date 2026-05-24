"use strict";

const { Reader } = require("maxmind");
const { readAssetBuffer, readAssetText } = require("./assets");

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function safeLookup(reader, ip) {
  const value = reader.get(ip);
  return value && typeof value === "object" ? value : {};
}

function loadGeo() {
  const countryInfo = JSON.parse(
    readAssetText("db/country.json", "db/country.json"),
  );
  const readers = [
    new Reader(readAssetBuffer("db/GeoOpen-Country.mmdb", "db/GeoOpen-Country.mmdb")),
    new Reader(readAssetBuffer("db/GeoOpen-Country-ASN.mmdb", "db/GeoOpen-Country-ASN.mmdb")),
  ];
  return { countryInfo, readers };
}

function lookupIp(ip, readers, countryInfo) {
  const records = readers.map((reader) => safeLookup(reader, ip));

  const iso = firstDefined(...records.map((r) => r.country?.iso_code), "Unknown");
  const details =
    iso && iso !== "Unknown" ? countryInfo[iso] || {} : {};

  const asOrganization = firstDefined(
    ...records.map((r) =>
      firstDefined(
        r?.country?.autonomous_system_organization,
        r?.country?.AutonomousSystemOrganization,
      ),
    ),
  );

  return {
    country: details["Alpha-3 code"] || iso || null,
    as_organization: asOrganization ? String(asOrganization).slice(0, 24) : null,
  };
}

module.exports = { loadGeo, lookupIp };
