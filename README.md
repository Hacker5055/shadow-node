# ◈ SHADOW NODE — Cyber-Tracker

> A hybrid between an advanced intelligence terminal and a modern anime tracking dashboard.
> Liquid-glass cyberpunk UI · persistent hacker CLI · CTF mechanics · live anime intel · bilingual AR/EN with RTL.

---

## ⚡ Quick start

```bash
cd shadow-node
npm install          # only dependency: express
npm run seed         # pulls REAL metadata for 23 curated targets (needs internet)
npm start            # http://localhost:3000
```

The node boots on **port 3000** and binds `0.0.0.0`, so it is reachable from a proxied preview URL too.

```bash
PORT=4000 node server/index.js        # custom port
DATA_SOURCE=jikan node server/index.js # use the Jikan (MyAnimeList) adapter instead of AniList
DATA_DIR=/tmp/sn-data node server/index.js  # custom datastore location
npm run reset                          # wipe + re-seed the datastore
```

---

## 🧩 Feature map

### 1 · The Command Terminal
A persistent CRT shell docked at the bottom of the screen (drag the grip to resize, `–` to collapse).

* Command **syntax stays English**; every output message follows the UI language (EN/AR).
* `TAB` autocompletes commands, `--flags` and target names · `↑/↓` history · `Ctrl+L` clears · `Ctrl+C` aborts.
* Every successful command fires the **liquid neon pulse** across all glass panels.

| Command | What it does |
|---|---|
| `scan --target "TO BE HERO X"` | Deep search of the live intel database (renders in the SCAN tab) |
| `sniff --latest` / `--trending` / `--packets` | Capture airing + upcoming releases, or dump a packet trace |
| `exploit --update-ep 12 [--target "monster"]` | Set the watched episode (auto-completes the target) |
| `exploit --status watching --rate 9 --note "text"` | Mutate status / rating / operator notes |
| `breach --target "classroom of the elite"` | Search **and** acquire a new target with a breach animation |
| `targets [--status watching] [--add "x"] [--rm ID]` | List / filter / mutate the watchlist |
| `select "vinland saga"` | Set the active target used by bare `exploit` / `intel` |
| `intel "monster"` | Print the full dossier in the terminal |
| `drop "monster" --force` · `open "monster"` | Delete · open the graphical dossier |
| `flag submit SN{...}` | Submit a captured CTF flag |
| `ctf [--hint CTF-02]` | List challenges, difficulty, location, reward; stronger hint on request |
| `theme --use abyss` / `theme --list` | Switch neon matrices (locked ones need their CTF) |
| `lang en` · `lang ar` | Switch language + direction |
| `netstat` `ps` `ping` `whoami` `sysinfo` | Network / process diagnostics (one of them leaks something…) |
| `decrypt <payload> [--hex\|--b64\|--rot13]` | Decode payloads — auto-detects encoding |
| `encode "text" --b64` | Encode helper |
| `resync` | Re-pull live metadata for every tracked target |
| `history` `clear` `banner` `date` `sudo` `exit` | Shell niceties + easter eggs |

### 2 · CTF mechanics — 5 hidden flags
Flags are **never shipped to the client**: the browser only ever receives challenge metadata, and validation happens server-side (`server/ctf.js`). Solving a flag **permanently** unlocks a neon matrix for that session (persisted in the datastore).

| # | Codename | Where it hides | Encoding | Reward |
|---|---|---|---|---|
| 01 | `SOURCE_LEAK` | HTML comment in `public/index.html` (`NODE_INTEL` blob) | Base64 | **Abyss Cyan** |
| 02 | `CONSOLE_ECHO` | `console.log` packet dump emitted at boot | HEX | **Phantom Magenta** |
| 03 | `HEADER_INJECT` | `X-Node-Packet` response header of `/api/anime/latest` | ROT13 | **Amber Override** |
| 04 | `WIRE_GHOST` | Malformed packet hex dump printed by `netstat` | HEX | **Violet Void** |
| 05 | `ROOT_ENTITY` | `<metadata>` block inside the logo SVG | plain | **Root Crimson** |

Difficulty is 1–4█, and `ctf --hint <id>` escalates from a poetic location hint to a precise one.
The **PACKETS** tab also renders a fake `tcpdump` stream (synthetic, served by the backend) as flavour — and as a place operators instinctively look.

### 3 · Intelligence Dashboard — "Active Targets"
Full CRUD over the watchlist:

* **Create** — `ACQUIRE` button (search → acquire) or `breach --target "..."`.
* **Read** — filter chips (all / watching / completed / paused / planned), dossier modal with synopsis, studios, genres, community score, next-episode countdown, AR+EN operator notes and a source link.
* **Update** — `＋/−` episode steppers on the card, or the edit modal (status, episodes, rating 1–10, priority, classification, bilingual notes).
* **Delete** — card `✕` or `drop <target> --force`, with a confirmation modal.
* Live HUD counters: targets, watching, episodes, hours, flags captured.

### 4 · Design language — Dark Liquid Glass × Cyberpunk
* Frosted translucent panels (`backdrop-filter: blur(22px) saturate(160%)`) floating over a live **matrix rain** canvas + drifting aurora blobs + masked grid veil.
* **Liquid neon borders**: conic-gradient masked to the 1px border, slowly rotating; every successful command triggers a whole-page **pulse** (`.glass` glow + inset ring).
* **Non-spinner loaders**: SVG gooey-filter *liquid metal* morph + live decryption stream + `tcpdump`-style packet bars — shown while "breaching the database", then posters **resolve out of blur** in a staggered decrypt reveal.
* Terminal: CRT scanlines, moving scan beam, phosphor glow, blinking block caret.
* Themes are pure CSS custom-property swaps (`--neon`, `--neon2`), so the entire UI recoloring is instant.

### 5 · Bilingual AR/EN + RTL
* `html[dir]` flips to `rtl` for Arabic; the layout uses logical properties (`inset-inline-*`, `margin-inline`, flex/grid order) so panels, chips, badges, cards and modals mirror correctly.
* Terminal **input stays LTR** (English command syntax) while output lines use `dir="auto"`, so Arabic lines align right automatically.
* Fonts: Orbitron (display) + Share Tech Mono (terminal) + Cairo (Arabic UI & terminal fallback).
* Every string — including all ~90 terminal output messages — lives in `public/js/i18n.js`.

### 6 · Data & backend
* **Node.js + Express 5** REST API, zero-dependency flat-file datastore with atomic writes (`data/shadow-node.db.json`).
* **AniList GraphQL** is the live intel source (search / byId / byIds / airing + upcoming + schedule / trending), with a **Jikan v4** adapter as an alternative source and automatic failover.
* 10-minute in-memory cache, request pacing, exponential backoff, and graceful degradation (trending falls back to the airing feed).
* Sessions are keyed by an `x-node-session` header, so CTF progress and theme unlocks are **per operator**.

---

## 🗂 Project structure

```
shadow-node/
├── server/
│   ├── index.js             # Express API + static host
│   ├── db.js                # atomic JSON datastore, sessions, audit ring buffer
│   ├── seed.js              # curated seed → live metadata merge
│   ├── ctf.js               # flag + theme definitions (server-side validation)
│   └── sources/
│       ├── index.js         # source resolver + failover
│       ├── anilist.js       # AniList GraphQL adapter (default)
│       └── jikan.js         # Jikan v4 adapter (DATA_SOURCE=jikan)
├── public/
│   ├── index.html           # shell + hidden CTF payloads (DOM comment, SVG metadata)
│   ├── css/styles.css       # liquid-glass design system, themes, loaders
│   └── js/
│       ├── app.js           # bootstrap + boot sequence
│       ├── terminal.js      # CRT shell: history, autocomplete, markers
│       ├── commands.js      # command registry (parsing + all commands)
│       ├── dashboard.js     # Active Targets CRUD + dossier/edit modals
│       ├── intel.js         # scan / feed / packets / CTF tabs
│       ├── themes.js        # neon matrices + unlock state
│       ├── i18n.js          # EN/AR dictionary + RTL plumbing
│       ├── store.js         # client state + event bus
│       ├── api.js           # session-aware fetch client
│       ├── matrix.js        # matrix rain canvas
│       ├── fx.js            # loaders, scramble, toasts, pulse, modal
│       └── ctf.js           # console payload + breadcrumbs
└── data/shadow-node.db.json # generated datastore
```

## 🔌 REST API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/state` | targets + stats + themes + ctf status + session |
| POST | `/api/session` | persist lang / theme / selected target |
| GET/POST | `/api/targets` | list · acquire (`{query}` or `{anilistId}`) |
| PATCH/DELETE | `/api/targets/:id` | update · drop |
| POST | `/api/resync` | re-pull metadata for all targets |
| GET | `/api/anime/search?q=` | live search |
| GET | `/api/anime/latest` | airing + upcoming + schedule + synthetic packets *(sets `X-Node-Packet`)* |
| GET | `/api/anime/trending` | trending (degrades to airing) |
| GET | `/api/anime/:id` | single record |
| GET/POST | `/api/ctf` · `/api/ctf/submit` | challenge list · flag validation |
| GET | `/api/health` · `/api/audit` | diagnostics · event log |

## 🎨 Themes

`toxic` (default) · `abyss` · `phantom` · `amber` · `violet` · `crimson` — the last five are sealed until their CTF is solved.

---

<details>
<summary><b>🚩 SPOILER — flag values (delete this block before sharing with players)</b></summary>

| # | Flag | How to recover it |
|---|---|---|
| 01 | `SN{y0u_r34d_th3_s0urc3}` | base64-decode the `NODE_INTEL` comment in `public/index.html` |
| 02 | `SN{p4ck3ts_n3v3r_l13}` | hex-decode the boot `console.log` packet dump, or `decrypt 534e7b… --hex` |
| 03 | `SN{d3crypt_th3_str34m}` | ROT13 the `X-Node-Packet` header on `/api/anime/latest` |
| 04 | `SN{sh4d0w_1n_th3_w1r3}` | hex-decode the malformed packet printed by `netstat` |
| 05 | `SN{r00t_4cc3ss_gr4nt3d}` | read `<metadata id="node-sigil-meta">` inside the logo SVG |

</details>

---

## Notes

* AniList is used by default because some sandboxed networks block `api.jikan.moe`; the Jikan adapter is fully implemented and selectable with `DATA_SOURCE=jikan`.
* Posters are hot-linked from the AniList CDN, so an internet connection is needed for artwork (titles, metadata and all tracking state work regardless).
* Requires Node ≥ 18 (uses global `fetch`).
