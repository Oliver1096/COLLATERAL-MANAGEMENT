# AGENTS.md

Guidance for cloud and coding agents working in this repository.

## Repository layout

`master` contains only a bilingual financial glossary (`Glossary of terms`). Runnable products live on separate feature branches — there is no monorepo tooling.

| Branch | Product | Stack |
|--------|---------|-------|
| `cursor/nsc-insights-homepage-70ee` | **NSC Insights** — React financial intelligence dashboard | npm, Vite 8, React 19, TypeScript |
| `cursor/finbert-sentiment-pipeline-0dcf` | FinBERT issuer sentiment pipeline | Python 3, pip, pytest |
| `cursor/an-lisis-sentimiento-x-3d05` | X/Twitter sentiment scraper | Python 3, pip, pytest |
| `cursor/asset-management-landing-5a38` | NSC Asset Management static landing page | HTML/CSS |
| `cursor/minimal-landing-page-8588` | Margin Studio static landing page | HTML/CSS/JS |
| `cursor/crear-sitio-web-minimalista-de-consultor-a-tecnol-gica-4ad0` | TechConsulting static site | HTML/CSS/JS |
| `cursor/download-nvidia-transcripts-4774` | NVIDIA earnings transcript dataset + downloader | Python 3 |

**Before running any app**, check out the branch for the product you are working on.

## NSC Insights (primary web app)

The main development target is **NSC Insights** on `cursor/nsc-insights-homepage-70ee`.

```bash
git checkout cursor/nsc-insights-homepage-70ee
cp .env.example .env   # first time only; fill in API keys as needed
npm install
npm run dev            # http://localhost:5173
```

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (frontend + in-process API proxy middleware) |
| `npm run build` | TypeScript check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve production build with the same API proxy |

There is **no** `lint` or `test` npm script. Type-checking is enforced via `npm run build` (`tsc -b`).

### Routes

Client-side routing via `window.location.pathname`:

- `/` — main macro dashboard
- `/renta-fija` — fixed-income rates
- `/scanner` — SEC NPORT-P fund holdings scanner

### API proxy (built into Vite)

The Vite dev/preview server exposes server-side endpoints (see `vite.config.ts`):

- `GET /api/fixed-income/overview` — multi-country yield overview
- `GET /api/scanner/sec-holdings?query=...` — SEC fund holdings lookup
- `/api/fred`, `/api/eia`, `/api/banxico`, `/api/boj` — proxied third-party APIs

### Environment variables (`.env`)

Copy from `.env.example`. Keys degrade gracefully when missing:

| Variable | Required for | Notes |
|----------|--------------|-------|
| `VITE_FRED_API_KEY` | Meaningful dashboard macro metrics | Without it, FRED metrics show placeholders |
| `VITE_EIA_API_KEY` | WTI crude oil data | Optional |
| `VITE_BANXICO_TOKEN` | Mexico TIIE rate on `/renta-fija` | Optional |
| `SEC_USER_AGENT` | SEC EDGAR requests | Has a default |
| `OPENFIGI_API_KEY` | Scanner queries by ISIN/CUSIP/name | Direct tickers (e.g. `SPY`) work without it |

Many sources (NY Fed SOFR, U.S. Treasury, ECB, BOJ) need no API key.

### Hello-world verification

With only `npm run dev` and no API keys, you can still verify the stack:

1. Open http://localhost:5173 — dashboard shell loads.
2. Open http://localhost:5173/scanner — search `SPY` — returns ~500 ETF holdings via SEC EDGAR + OpenFIGI.
3. Open http://localhost:5173/renta-fija — fixed-income page loads (some rows need keys).

## Python branches

For FinBERT or X-sentiment branches:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest   # if tests exist on that branch
```

Each pipeline is a CLI batch job, not a long-running server. See each branch's `README` or config examples for run commands.

## Static landing pages

No build step. Serve with any static HTTP server, e.g. `python3 -m http.server 8000`, or open `index.html` directly.

## Cursor Cloud specific instructions

- **Default branch has no app.** Agents must `git checkout` the product branch before installing dependencies.
- **Node.js** v22+ and **npm** are sufficient for NSC Insights; no Docker or database is required.
- **Dev server:** use a tmux session (e.g. `vite-dev-server`) for `npm run dev` — it is long-running. The server binds to `localhost:5173` by default.
- **`.env` is gitignored.** Create it from `.env.example` on first setup; it is not created by `npm install`.
- **Build output:** `dist/` is gitignored; run `npm run build` to verify TypeScript and Vite production build.
- **Scanner E2E without secrets:** `GET /api/scanner/sec-holdings?query=SPY` succeeds without `OPENFIGI_API_KEY` because ticker resolution has a fallback path.
- **Other branches** (Python pipelines, static sites) are independent; switching branches may leave `node_modules/` behind — re-run `npm install` when returning to NSC Insights.
