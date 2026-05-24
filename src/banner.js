"use strict";

const { VERSION } = require("./cli");

const ANSI = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

const ART = [
  "███╗   ██╗███████╗████████╗██████╗ ███████╗ █████╗  ██████╗██╗  ██╗",
  "████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║",
  "██╔██╗ ██║█████╗     ██║   ██████╔╝█████╗  ███████║██║     ███████║",
  "██║╚██╗██║██╔══╝     ██║   ██╔══██╗██╔══╝  ██╔══██║██║     ██╔══██║",
  "██║ ╚████║███████╗   ██║   ██║  ██║███████╗██║  ██║╚██████╗██║  ██║",
  "╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝",
];

const TAGLINE = "Find what's still reachable when the network says no.";

function colorize(useColor) {
  return useColor
    ? (text, code) => `${code}${text}${ANSI.reset}`
    : (text) => text;
}

function render({ color = process.stdout.isTTY } = {}) {
  const c = colorize(Boolean(color));
  const lines = ART.map((line) => `  ${c(line, ANSI.cyan)}`);
  const subtitle = `  ${c(TAGLINE, ANSI.bold)}`;
  const meta = `  ${c(`v${VERSION}  •  github.com/WhoisGray/NetReach`, ANSI.gray)}`;
  return ["", ...lines, "", subtitle, meta, ""].join("\n");
}

function print(options = {}) {
  if (options.showBanner === false) return;
  process.stdout.write(render(options) + "\n");
}

module.exports = { render, print, ART, TAGLINE };
