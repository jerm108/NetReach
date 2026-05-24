#!/usr/bin/env node
"use strict";

const { run } = require("./src/runner");

run().catch((error) => {
  console.error(`Error: ${error.message || error}`);
  process.exitCode = 1;
});
