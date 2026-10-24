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
| D-05 | Weather provider (and forecast horizon) | Phase 0, before Phase 2 | Open | See TRD §5. Evidence so far, **to be re-verified against official pages in Phase 0**: Open-Meteo's free API needs no key, allows non-commercial use (no ads or subscriptions), requires CC BY 4.0 attribution, and lists limits of 600/min, 5,000/h, 10,000/day. WeatherAPI.com pricing was not verified. |
| D-06 | Weather-provider key handling | Phase 0, before Phase 2 | Open | A key used directly from the browser is public. Either use a keyless provider, or route weather calls through the same server/serverless layer as the assistant. BR-11 must hold either way. |
| D-07 | Map base tiles | Phase 0, before Phase 5 | Open | Verify the usage policy for the chosen tile provider. The public OpenStreetMap tile servers have their own usage policy; check it before relying on them for a public deployment. |
| D-08 | Weather overlay source | Phase 0, before Phase 5 | Open | RainViewer's public docs currently describe free radar tiles as past data only (about 2 hours), max zoom 7, 100 requests/IP/min, "for personal and educational use". Whether a public portfolio site qualifies is not stated. Verify, or choose another source. Leaflet must cap native zoom to whatever the source supports. |
| D-09 | First-run experience and active location | Before Phase 2 | Proposed default | On first visit with no location: show a search-first empty state, and an optional "Use my location" button (never auto-prompt for geolocation). Persist the active location locally. Deep links such as `/?loc=<id>` are optional. |
| D-10 | Unit handling | Phase 2 | Proposed default | Store and pass domain values in metric; convert only at display time through one formatting module. Default metric. Toggle UI and persistence in Phase 4. |
| D-11 | Time-zone rule | Phase 2 | Proposed default | Show times in the selected location's time zone, labeled. On Compare, label each city's local time clearly. |
| D-12 | Runtime validation library | Phase 2 | Proposed default | Zod, introduced when the first provider payload is validated. A hand-written guard is fine for Phase 1 theme storage. |
| D-13 | Photography source and licensing | Before Phase 3 | Open | See DESIGN_SPEC §9. Record each photo's source, license and credit in `docs/CREDITS.md`. |
| D-14 | Runtime AI provider, billing, and whether live AI ships in the first public deployment | Phase 0 (decision), Phase 6 (build) | Open | A paid Claude chat plan does not include runtime API access. Decide provider, budget cap, and abuse protection (rate limiting) for an unauthenticated public endpoint. Gating AI behind configuration is an allowed outcome. |
| D-15 | Deployment platform | Before Phase 6 | Open | Must support the server/serverless endpoint and SPA routing. |
| D-16 | Comparison limits | Phase 4 | Proposed default | 2 to 4 cities. |
| D-17 | Browser support | Phase 1 | Proposed default | Current evergreen browsers (latest two versions of Chrome, Edge, Firefox, Safari). |

## B. Things only the project owner can do

- Create the Git repository (and a GitHub remote if wanted) and put these docs in it before the first session.
- Sign up for any provider chosen in Phase 0 and keep keys in a local, ignored `.env`. Confirm sign-up and billing actually work from where you are; some providers restrict by region.
- Supply or approve photography (D-13).
- Approve each phase's completion report before the next session starts.

## C. Nice-to-have, not required for the MVP

CI workflow (lint, typecheck, test, build) · Lighthouse targets · page titles, meta tags, and a social-share image · a license file · favicon and app icons.
