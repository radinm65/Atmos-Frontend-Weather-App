# Atmos

Atmos is a portfolio-grade weather web application with a cinematic photographic visual direction and a structured, data-rich dashboard.

## Current product decisions

- **Visual direction:** Cinematic Sky, a live interactive procedural sky (changed from photography by the owner on 2026-10-24; photography is optional)
- **Layout:** Hybrid — cinematic weather hero plus structured dashboard
- **Themes:** Light and dark
- **MVP:** Current conditions, forecasts, city search, saved locations, city comparison, interactive weather map, and AI weather assistant
- **Accounts:** No sign-up; persist preferences and saved locations locally
- **Frontend:** React + TypeScript + Vite
- **Styling:** CSS Modules / organized CSS with CSS custom properties; Tailwind is not required
- **Data fetching/cache:** TanStack Query
- **Routing:** React Router
- **Charts:** Recharts
- **Map:** Leaflet; map tiles and weather overlays must be validated independently
- **Tests:** Vitest + React Testing Library; Playwright for critical end-to-end flows

## Documentation

Read these files before implementation:

1. `docs/BRD.md` — product goals and boundaries
2. `docs/PRD.md` — features, stories, and acceptance criteria
3. `docs/DESIGN_SPEC.md` — visual and interaction requirements
4. `docs/TRD.md` — architecture and technical decisions
5. `docs/AI_RULES.md` — implementation rules for coding agents
6. `docs/IMPLEMENTATION_PLAN.md` — phased delivery plan and gates
7. `docs/OPEN_DECISIONS.md` — decisions still open, proposed defaults, and owner-only prerequisites
8. `docs/CLAUDE_START_PROMPT.md` — prompt for the first coding session
9. `docs/PROVIDER_VALIDATION.md` — Phase 0 findings on weather, map, overlay, AI and deployment providers

`CLAUDE.md` (repo root) is the short project memory that Claude Code loads automatically; it points back to these docs.

## Important status note

These documents capture the current approved direction and initial technical assumptions. Provider plan limits, licensing, attribution, map tile policies, and overlay compatibility must be rechecked against official documentation before integration. Do not present a provider as production-ready until those checks are complete.
