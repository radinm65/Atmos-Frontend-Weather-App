# Atmos — Claude Code project memory

Atmos is a portfolio-grade weather web app: cinematic weather photography + a structured, data-rich dashboard. React + TypeScript + Vite, no backend framework, no accounts.

## Read first

@README.md
@docs/AI_RULES.md
@docs/IMPLEMENTATION_PLAN.md
@docs/OPEN_DECISIONS.md

Read the others on demand for the task at hand: `docs/BRD.md` (goals/scope), `docs/PRD.md` (stories + acceptance criteria), `docs/DESIGN_SPEC.md` (visual rules, tokens), `docs/TRD.md` (architecture).

## Hard rules (full list in `docs/AI_RULES.md`)

- Work one phase at a time from `docs/IMPLEMENTATION_PLAN.md`. Stop at the end of the phase and wait for review.
- Inspect the repo before editing. Preserve useful existing code. No unrelated refactors.
- Strict TypeScript, no `any` without a written justification.
- CSS Modules + CSS custom properties from `src/styles/`. No Tailwind, no Docker, no new dependency without a concrete need.
- Never fake weather. Fixtures only in tests or clearly labeled dev states.
- Never put secrets in the repo or client bundle. `VITE_*` variables are public.
- If a doc is silent or contradictory, or a decision in `docs/OPEN_DECISIONS.md` is still open and blocks you: ask. Do not decide silently.
- Never claim a check passed unless you ran it and saw the result.
- Do not commit or push unless the user asks.

## Commands

The app lives in `frontend/` (git root is the parent folder). Run these from `frontend/`; npm, Node >= 22.12 (`.nvmrc` = 22).

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Type-check (`tsc -b`) then production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (ESLint 9: `eslint-plugin-jsx-a11y` does not support 10 yet) |
| `npm run typecheck` | `tsc -b`, strict mode |
| `npm run format` / `npm run format:check` | Prettier write / check |
| `npm test` | Vitest + React Testing Library, single run |
| `npm run test:watch` | Vitest watch mode |
| `npm run snapshots:record` | Records real Open-Meteo forecasts for the 12 cities in `scripts/snapshot-cities.json` into `public/snapshots/` (all-or-nothing; commit the result). Run a few times, and once right before release |
| `npm run dev:snapshot` / `npm run build:snapshot` | Run or build in snapshot mode (`.env.snapshot`): serves the recorded files instead of calling the live API; search covers only recorded cities |
| e2e | Not set up yet (Playwright arrives in a later phase) |

npm on this machine needs the system proxy: see the Claude memory note, or set `HTTPS_PROXY=http://127.0.0.1:10808` for installs only.

Source layout follows `docs/TRD.md` §2: `src/app`, `src/components/{ui,layout,feedback}`, `src/features/*`, `src/domain`, `src/lib/{api,config,formatting,query,schemas,storage}`, `src/styles`. Tests sit next to the code as `*.test.ts(x)`; test-only helpers live in `src/test/` and `*/testFixtures.ts` and must never be imported by app code.

Data layer (Phase 2): components never touch provider payloads. They use hooks (`useWeather`, `useLocationSearch`) that go through a `WeatherDataSource` (`src/lib/api/dataSource.ts`). `VITE_DATA_SOURCE=live|snapshot` picks the live Open-Meteo source or the recorded-snapshot source; both stay in the codebase (D-18).

## Completion report

End every task with: Summary · Files Changed · Verification (real commands, real results) · Acceptance Criteria · Limitations · Next Step.
