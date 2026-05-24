<div align="center">

```
███╗   ██╗███████╗████████╗██████╗ ███████╗ █████╗  ██████╗██╗  ██╗
████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║
██╔██╗ ██║█████╗     ██║   ██████╔╝█████╗  ███████║██║     ███████║
██║╚██╗██║██╔══╝     ██║   ██╔══██╗██╔══╝  ██╔══██║██║     ██╔══██║
██║ ╚████║███████╗   ██║   ██║  ██║███████╗██║  ██║╚██████╗██║  ██║
╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
```

### Find what's still reachable when the network says no. 🛰️

[![Release](https://img.shields.io/github/v/release/WhoisGray/NetReach?style=flat-square&color=brightgreen)](https://github.com/WhoisGray/NetReach/releases/latest)
[![License](https://img.shields.io/github/license/WhoisGray/NetReach?style=flat-square)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/WhoisGray/NetReach/total?style=flat-square)](https://github.com/WhoisGray/NetReach/releases)
[![Stars](https://img.shields.io/github/stars/WhoisGray/NetReach?style=flat-square&color=yellow)](https://github.com/WhoisGray/NetReach/stargazers)
[![Platforms](https://img.shields.io/badge/runs%20on-Linux%20%7C%20macOS%20%7C%20Windows-blue?style=flat-square)](#-install)
[![Made for](https://img.shields.io/badge/made%20for-the%20heavily--filtered%20internet-red?style=flat-square)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/WhoisGray/NetReach/release.yml?style=flat-square&label=build)](https://github.com/WhoisGray/NetReach/actions)

**[ Download ](https://github.com/WhoisGray/NetReach/releases/latest) · [ Docs ](#-usage) · [ Use with v2ray ](#%EF%B8%8F-use-with-v2ray--xray--sing-box) · [ Build from source ](#-build-from-source)**

</div>

---

> **TL;DR** — Drop a single binary onto your machine. NetReach hammers ~1900 well-known endpoints (and any list you give it) with TCP, HTTPS, and HTTP probes in parallel, then hands you a sorted JSON of the IPs that actually answered. Built for the kind of internet where `ping` lies and only one port works.

```
┌─────────────────────┬──────────────────┬─────┬───────┬─────┬─────┬───────┬──────┐
│ target              │ ip               │ cc  │ asn   │ ms  │ tcp │ https │ http │
├─────────────────────┼──────────────────┼─────┼───────┼─────┼─────┼───────┼──────┤
│ cloudflare.com      │ 104.16.132.229   │ USA │ CFLR  │  12 │  12 │  301  │  301 │
│ github.com          │ 140.82.121.4     │ USA │ GITHB │  20 │  20 │  200  │  301 │
│ vercel.com          │ 76.76.21.21      │ USA │ VRCL  │  87 │  87 │  308  │  301 │
│ huggingface.co      │ 3.163.189.114    │ USA │ AMZN  │  92 │  92 │  301  │   -  │
│ pypi.org            │ 151.101.0.223    │ USA │ FSTLY │ 105 │ 105 │  200  │  301 │
└─────────────────────┴──────────────────┴─────┴───────┴─────┴─────┴───────┴──────┘
  Domains: 1900/1900  |  IPs: 4218  |  OK: 612  |  FAIL: 3606  |  Elapsed: 41.3s
```

<div align="center">

<!-- Replace with a real GIF when you have one. Asciinema or vhs work great. -->
<!-- ![demo](docs/demo.gif) -->

</div>

---

## ✨ Why NetReach?

On a hostile network, every tool lies in a different way:

| Symptom | Why your usual tool fails |
| --- | --- |
| `ping` returns 100% loss | ICMP is silently dropped at the border |
| `curl` hangs forever | Port 80 is filtered, but 443 is fine |
| TLS handshake works, page is 403 | SNI-based filtering is closing the right connection |
| One Cloudflare IP works, another doesn't | DPI is killing specific edges, not the whole CDN |

NetReach probes **TCP/443**, **HTTPS/443 (SNI + Host)**, and **HTTP/80** in parallel for every IP of every target. A host is reported reachable if **any** probe answers. Results are sorted by best latency and annotated with country + ASN — so you can pick clean Cloudflare edges, fast Fastly nodes, or whatever else your network still likes.

## 🚀 Install

Grab the latest binary for your platform from the **[Releases page](https://github.com/WhoisGray/NetReach/releases/latest)**:

| Platform               | Asset                          |
| ---------------------- | ------------------------------ |
| 🐧 Linux x64           | `netreach-linux-x64.zip`       |
| 🐧 Linux ARM64         | `netreach-linux-arm64.zip`     |
| 🍎 macOS Apple Silicon | `netreach-macos-arm64.zip`     |
| 🍎 macOS Intel         | `netreach-macos-x64.zip`       |
| 🪟 Windows x64         | `netreach-windows-x64.zip`     |

```bash
# Linux / macOS
unzip netreach-*.zip
chmod +x netreach-*
./netreach-*

# Windows
Expand-Archive netreach-windows-x64.zip
.\netreach-win32-x64.exe
```

> 💡 **macOS quarantine?** First run may be blocked. Either right-click → Open, or:
> `xattr -d com.apple.quarantine ./netreach-darwin-arm64`

No Node.js, no `pip`, no `apt install`. One file. Geo databases and a 1900-target seed list are baked into the binary.

## 🛡️ Use with v2ray / Xray / sing-box

This is what most people use NetReach for: **finding clean Cloudflare IPs to plug into a proxy config.**

```bash
# 1. Scan Cloudflare-fronted endpoints
echo "cloudflare.com" > cf-targets.txt
echo "www.cloudflare.com" >> cf-targets.txt
echo "104.16.0.0/13" >> cf-targets.txt
./netreach cf-targets.txt -o cf.json --no-banner

# 2. Pull the 10 fastest IPs into a file
jq -r '.[0:10][] | .ip' cf.json > clean-ips.txt

# 3. Feed them into your proxy config
#    Xray: route.rules[].ip
#    sing-box: outbounds[].server
#    v2ray: outbounds[].settings.servers[].address
```

Pair NetReach with an idle-time cron job to keep your list fresh:

```bash
# crontab: refresh every 6 hours
0 */6 * * * /opt/netreach -q -o /etc/proxy/clean-ips.json --top 50
```

## 🎮 Usage

```text
netreach [OPTIONS] [TARGETS_FILE]
```

| Flag                      | What it does                                            | Default       |
| ------------------------- | ------------------------------------------------------- | ------------- |
| `-o, --output <file>`     | Write reachable results as JSON                         | `result.json` |
| `-c, --concurrency <n>`   | Parallel probes                                         | `200`         |
| `--tcp-timeout <ms>`      | TCP connect timeout                                     | `5000`        |
| `--https-timeout <ms>`    | HTTPS request timeout                                   | `8000`        |
| `--http-timeout <ms>`     | HTTP request timeout                                    | `8000`        |
| `--top <n>`               | Keep only the top-N (by latency) in the output          | unlimited     |
| `--preview <n>`           | Rows shown in the live table                            | `50`          |
| `--no-tcp`                | Disable raw TCP probe                                   |               |
| `--no-https`              | Disable HTTPS probe                                     |               |
| `--no-http`               | Disable plain HTTP probe                                |               |
| `--no-banner`             | Don't print the startup banner                          |               |
| `-q, --quiet`             | Suppress live table; print only the final summary       |               |
| `-j, --json`              | Print final JSON to stdout (implies `--quiet`)          |               |
| `-h, --help`              | Show help                                               |               |
| `-v, --version`           | Show version                                            |               |

### Recipes

```bash
# Default scan with the bundled list
./netreach

# Bring your own targets
./netreach my-targets.txt

# HTTPS-only sweep (port 80 is dead on your network)
./netreach --no-tcp --no-http

# Quiet, top-50, JSON to a path
./netreach -q --top 50 -o working.json

# Stream JSON to stdout for piping
./netreach --top 100 -j | jq '[.[] | {ip, ms: .latency, cc: .country}]'

# Pessimistic timeouts for a very slow link
./netreach --tcp-timeout 10000 --https-timeout 15000 --http-timeout 15000 -c 80
```

## 📊 Output format

`result.json` (or stdout with `-j`) is an array sorted by best latency:

```json
[
  {
    "target": "vercel.com",
    "ip": "76.76.21.21",
    "country": "USA",
    "as_organization": "VERCEL-ASN",
    "latency": 87,
    "tcp": 87,
    "https": 308,
    "http": 301,
    "status": "OK"
  }
]
```

- `tcp` — TCP/443 handshake time in ms, or `null` if it failed.
- `https` / `http` — HTTP status code from the probe, or `null` if the request errored/timed out.
- `latency` — the minimum of all successful probe latencies.
- `status` — `OK` if at least one probe answered, `FAIL` otherwise.

## 🧠 How it works

```
   target ─► DNS ─┬─► IP #1 ─┬─► TCP/443 ─┐
                  │          ├─► HTTPS/443 ├─► merge ─► row
                  │          └─► HTTP/80  ─┘
                  ├─► IP #2 …
                  └─► IP #n …
```

For each target, NetReach:

1. Resolves it to all A records (or treats it as a literal IP).
2. Spawns three concurrent probes per IP — TCP, HTTPS-with-SNI, plain HTTP.
3. Marks the row reachable if **any** probe succeeds.
4. Enriches with offline GeoIP (country + ASN) from CIRCL's open data.
5. Sorts everything by minimum latency and writes JSON.

All wrapped in a `p-limit` semaphore so 1900 targets stay polite at `--concurrency 200`.

## 🔧 Build from source

```bash
git clone https://github.com/WhoisGray/NetReach.git
cd NetReach
pnpm install
pnpm db          # download fresh GeoIP databases (~90 MB, not committed)
pnpm start       # run directly with Node
pnpm build       # produce a single-file SEA binary for this platform
```

Output:

```
dist/netreach-<platform>-<arch>[.exe]
```

> 🪶 **Why isn't the GeoIP data in git?** Two 80 MB binary files would bloat the repo and go stale. CI re-downloads them on every release so users get the freshest geographic + ASN data possible. Locally, `pnpm db` (or `node scripts/download-db.js`) does the same.

### Requirements

- **Node.js ≥ 20.12** built with the SEA fuse — official builds from [nodejs.org](https://nodejs.org/) or nvm/fnm/volta. Homebrew's `node` does **not** ship with the fuse; the build script will scan your system and pick a compatible binary, or you can point at one explicitly:
  ```bash
  NODE_SEA_EXECUTABLE=/path/to/official/node pnpm build
  ```

## 🚢 Releasing

Tag and push — CI handles the rest:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `Release` workflow builds for all 5 targets, zips each binary, and attaches them to a new GitHub Release with auto-generated notes. You can also kick it off manually from the Actions tab.

## 🗂️ Project layout

```
NetReach/
├── .github/workflows/release.yml   CI: 5 platforms → zip → GitHub Release
├── db/                             GeoIP data (mmdb files gitignored, fetched at build)
├── scripts/
│   ├── download-db.js              Fetches GeoIP DBs from CIRCL
│   └── build-sea.js                Single-binary SEA builder
├── src/
│   ├── banner.js                   ASCII art + tagline
│   ├── cli.js                      Argument parser + --help
│   ├── config.js                   Default settings
│   ├── assets.js                   SEA-aware asset loader
│   ├── targets.js                  Target file parsing
│   ├── dns.js                      DNS resolve + cache
│   ├── geoip.js                    Country + ASN lookup
│   ├── probes.js                   TCP, HTTPS, HTTP probes
│   ├── checker.js                  Per-IP probe orchestration
│   ├── display.js                  Live table renderer
│   └── runner.js                   Top-level orchestrator
├── index.js                        Entry point
└── targets.txt                     ~1900 default targets (embedded in the binary)
```

## 🤝 Contributing

PRs and issues welcome, especially:

- New target categories (mirrors, package registries, AI APIs in $REGION).
- Probe ideas — QUIC? DoH? Native UDP? Open a discussion.
- Telemetry-free improvements only. NetReach never phones home.

## ⚖️ License

[MIT](LICENSE) — do whatever, but don't blame me if your border router doesn't like it.

## 🙋 Author

Built by **[WhoisGray](https://github.com/WhoisGray)**.

If NetReach saved your evening, drop a ⭐ — that's the only telemetry this project will ever have.
