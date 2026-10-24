# Open Decisions and Human Prerequisites

**Purpose:** Things the docs deliberately leave open, or that only the project owner can do. Coding agents must not decide these silently. When a decision is made, update its row (status, choice, date, source link) and, if it changes a spec, edit that spec.

**Status values:** `Open` · `Proposed default` (agent may proceed with the default, and must flag it in the completion report) · `Decided`

## A. Decisions

| ID | Decision | Needed by | Status | Proposed default / notes |
|---|---|---|---|---|
| D-01 | Package manager and Node version | Phase 1 | Proposed default | npm, current Node LTS; pin with `engines` and `.nvmrc`. Keep an existing lockfile if the repo already has one. |
| D-02 | Default theme on first visit | Phase 1 | Proposed default | Follow `prefers-color-scheme`; fall back to dark. User choice overrides and persists. Apply the theme before first paint (inline script in `index.html`) so there is no flash. |
| D-03 | UI language | Phase 1 | Proposed default | English only, no i18n in the MVP. Use `lang="en"`. |
| D-04 | Font families | Before Phase 3 | Open | Phase 1 uses a system font stack behind `--font-sans` / `--font-display` tokens. Pick final fonts (self-hosted, not a Google Fonts CDN) when the hero is designed. |
| D-05 | Weather provider (and forecast horizon) | Phase 0, before Phase 2 | **Decided** (owner, 2026-10-24) | **Open-Meteo** (weather + geocoding): no key, 16-day horizon (tested), CORS `*` (tested), 600/min · 5,000/h · 10,000/day, non-commercial only (no ads or subscriptions), CC BY 4.0 + GeoNames credit. WeatherAPI.com rejected: free plan has only a 3-day forecast. Evidence and links: `docs/PROVIDER_VALIDATION.md` §1. Portfolio-as-non-commercial is an inference; optional email to Open-Meteo. |
| D-06 | Weather-provider key handling | Phase 0, before Phase 2 | **Decided** (owner, 2026-10-24) | Keyless Open-Meteo called directly from the browser, which satisfies BR-11 for weather with no server layer. A server/serverless layer is needed only for the assistant. |
| D-07 | Map base tiles | Phase 0, before Phase 5 | **Decided** (owner, 2026-10-24) | OSM standard tiles for the MVP, behind one swappable tile-source config. Policy allows public sites with visible attribution, valid Referer, no prefetching, best-effort availability, and a right to block heavy use. CARTO raster (free key, non-commercial up to 5M tiles/month) is the fallback. See `PROVIDER_VALIDATION.md` §2. |
| D-08 | Weather overlay source | Phase 0, before Phase 5 | **Decided with a gate** (owner, 2026-10-24) | RainViewer past-radar, **gated on confirming its terms first in Phase 5**. API tested: CORS `*`, 13 past frames, 0 nowcast. Secondary sources say max zoom 7, 100 req/IP/min, mandatory attribution, "personal and educational" use. rainviewer.com was unreachable from the dev machine, so whether a public portfolio qualifies is **unverified**. Fallback if not allowed: OpenWeather map tiles behind a caching proxy (60 calls/min is shared by all visitors; key would be public otherwise). See `PROVIDER_VALIDATION.md` §3. |
| D-09 | First-run experience and active location | Before Phase 2 | Proposed default | On first visit with no location: show a search-first empty state, and an optional "Use my location" button (never auto-prompt for geolocation). Persist the active location locally. Deep links such as `/?loc=<id>` are optional. |
| D-10 | Unit handling | Phase 2 | Proposed default | Store and pass domain values in metric; convert only at display time through one formatting module. Default metric. Toggle UI and persistence in Phase 4. |
| D-11 | Time-zone rule | Phase 2 | Proposed default | Show times in the selected location's time zone, labeled. On Compare, label each city's local time clearly. |
| D-12 | Runtime validation library | Phase 2 | Proposed default | Zod, introduced when the first provider payload is validated. A hand-written guard is fine for Phase 1 theme storage. |
| D-13 | Photography source and licensing | Before Phase 3 | Open | See DESIGN_SPEC §9. Record each photo's source, license and credit in `docs/CREDITS.md`. |
| D-14 | Runtime AI provider, billing, and whether live AI ships in the first public deployment | Phase 0 (decision), Phase 6 (build) | **Decided in part** (owner, 2026-10-24) | A paid Claude chat plan does not include runtime API access. **Decided:** build the assistant gated by configuration and ship it disabled until the owner has an API account, a monthly spend cap, and endpoint rate limiting. **Still open:** which runtime provider/model and the budget (decide before Phase 6). Prices read 2026-10-24 (per MTok in/out): Haiku 5.5 $0.10/$0.50, Sonnet 5.5 $2/$10. See `PROVIDER_VALIDATION.md` §4. |
| D-15 | Deployment platform | Before Phase 6 | Open — **candidate noted** | Must support the server/serverless endpoint and SPA routing. Cloudflare Workers with static assets (SPA fallback supported; free plan 100k requests/day) is the first candidate; secrets handling on the free plan not yet confirmed. See `PROVIDER_VALIDATION.md` §5. |
| D-16 | Comparison limits | Phase 4 | Proposed default | 2 to 4 cities. |
| D-17 | Browser support | Phase 1 | Proposed default | Current evergreen browsers (latest two versions of Chrome, Edge, Firefox, Safari). |
| D-18 | Live API trial, then recorded snapshots | Phase 2 (design), Phase 7 (switch) | **Decided in principle** (owner, 2026-10-24); details Open | During a trial period the app uses the live Open-Meteo API while a recorder script saves the raw provider responses. After the trial, the build switches to serving those recorded files, and the live API code stays in the repo (only the transport is swapped). See TRD §4a. Snapshots must always be labeled as recorded data with their capture date, never shown as live. **Open sub-decisions:** trial length; which cities and how often to record; whether searching is limited to the recorded cities after the switch; whether snapshot mode is the default in the public deployment or only after the trial. |

## B. Things only the project owner can do

- Create the Git repository (and a GitHub remote if wanted) and put these docs in it before the first session.
- Sign up for any provider chosen in Phase 0 and keep keys in a local, ignored `.env`. Confirm sign-up and billing actually work from where you are; some providers restrict by region.
- Supply or approve photography (D-13).
- Approve each phase's completion report before the next session starts.

## C. Nice-to-have, not required for the MVP

CI workflow (lint, typecheck, test, build) · Lighthouse targets · page titles, meta tags, and a social-share image · a license file · favicon and app icons.
