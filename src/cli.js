"use strict";

const { DEFAULTS } = require("./config");

const VERSION = "1.0.0";
const NAME = "netreach";

const HELP = `
NetReach v${VERSION} - Reachability scanner for heavily-filtered networks

USAGE
  ${NAME} [OPTIONS] [TARGETS_FILE]

ARGUMENTS
  TARGETS_FILE              Path to a custom targets file. One target per line.
                            Lines starting with '#' are comments.
                            If omitted, the bundled targets list is used.

OPTIONS
  -o, --output <file>       Write reachable results to <file> (default: ${DEFAULTS.output})
  -c, --concurrency <n>     Parallel probes (default: ${DEFAULTS.concurrency})
      --tcp-timeout <ms>    TCP connect timeout in ms (default: ${DEFAULTS.tcpTimeout})
      --https-timeout <ms>  HTTPS request timeout in ms (default: ${DEFAULTS.httpsTimeout})
      --http-timeout <ms>   HTTP request timeout in ms (default: ${DEFAULTS.httpTimeout})
      --top <n>             Limit JSON output to top N by latency
      --preview <n>         Rows shown in the live table (default: ${DEFAULTS.previewLimit})
      --no-tcp              Disable raw TCP probe
      --no-https            Disable HTTPS probe
      --no-http             Disable plain HTTP probe
      --no-banner           Don't print the startup banner
  -q, --quiet               Suppress live table (only print final summary)
  -j, --json                Print final JSON to stdout instead of writing a file
  -h, --help                Show this help
  -v, --version             Show version

EXAMPLES
  ${NAME}                            Scan bundled targets
  ${NAME} my-targets.txt             Use a custom list
  ${NAME} --no-http -c 400           HTTPS+TCP only, higher concurrency
  ${NAME} -o working.json --quiet    Silent run, write to working.json
  ${NAME} --top 100 -j > out.json    Print top 100 as JSON

WHY DUAL PROBES
  Under harsh filtering, ICMP ping is unreliable, port 80 may be blocked while
  443 is open, or vice-versa. NetReach probes TCP/443, HTTPS/443, and HTTP/80
  in parallel and marks an IP reachable if any probe succeeds.
`;

function printHelp() {
  process.stdout.write(HELP);
}

function printVersion() {
  process.stdout.write(`${NAME} ${VERSION}\n`);
}

function parseInt10(value, name) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid value for ${name}: ${value}`);
  }
  return n;
}

function parseArgs(argv) {
  const config = { ...DEFAULTS };
  let targetsPath = null;

  const args = argv.slice(2);
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    const next = () => {
      const v = args[++i];
      if (v === undefined) throw new Error(`Missing value for ${arg}`);
      return v;
    };

    switch (arg) {
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
      case "-v":
      case "--version":
        printVersion();
        process.exit(0);
      case "-o":
      case "--output":
        config.output = next();
        break;
      case "-c":
      case "--concurrency":
        config.concurrency = parseInt10(next(), arg);
        break;
      case "--tcp-timeout":
        config.tcpTimeout = parseInt10(next(), arg);
        break;
      case "--https-timeout":
        config.httpsTimeout = parseInt10(next(), arg);
        break;
      case "--http-timeout":
        config.httpTimeout = parseInt10(next(), arg);
        break;
      case "--top":
        config.topN = parseInt10(next(), arg);
        break;
      case "--preview":
        config.previewLimit = parseInt10(next(), arg);
        break;
      case "--no-tcp":
        config.probeTcp = false;
        break;
      case "--no-https":
        config.probeHttps = false;
        break;
      case "--no-http":
        config.probeHttp = false;
        break;
      case "--no-banner":
        config.showBanner = false;
        break;
      case "-q":
      case "--quiet":
        config.quiet = true;
        break;
      case "-j":
      case "--json":
        config.jsonOnly = true;
        config.quiet = true;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}. Try --help.`);
        }
        if (targetsPath !== null) {
          throw new Error(`Unexpected extra argument: ${arg}`);
        }
        targetsPath = arg;
        break;
    }
    i++;
  }

  if (!config.probeTcp && !config.probeHttps && !config.probeHttp) {
    throw new Error("At least one probe (tcp/https/http) must be enabled.");
  }

  return { config, targetsPath };
}

module.exports = { parseArgs, printHelp, printVersion, VERSION, NAME };
