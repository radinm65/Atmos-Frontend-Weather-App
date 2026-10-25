# Atmos Implementation Plan

**Version:** 1.0  
**Status:** Proposed execution sequence

## Delivery rules

- Work in small, reviewable phases.
- Complete and verify each phase before moving on.
- Do not integrate multiple external services at once.
- Use real provider data for the actual weather flow; fixtures are allowed only in tests or clearly labeled development states.
- Record provider decisions and known limitations in the docs.
- Every phase ends with a review and a short completion report.
- Open decisions live in `docs/OPEN_DECISIONS.md`. A phase may not start while a decision marked "needed by" that phase is still `Open`.

## Session order

1. **Session 1 — Phase 1** (`CLAUDE_START_PROMPT.md`). Needs no provider decisions.
2. **Session 2 — Phase 0 (provider validation).** Research and documentation only: verify weather provider, key handling, map tiles, overlay, and AI approach against official pages; update `TRD.md` and `OPEN_DECISIONS.md`. No integration code. Must finish before Phase 2. The owner then signs up for any chosen provider.
3. **Sessions 3+ — Phases 2 to 7**, one phase per session, in order. Photography (D-13) must be sourced before Phase 3.

## Phase 0 — Repository and provider validation

**Goal:** Confirm the implementation environment and avoid building against unsuitable service assumptions.

Tasks:
- Inspect repository state and current branch before making changes.
- Confirm Node.js/package manager versions and existing tooling.
- Verify current official weather-provider free-tier limits, forecast horizon, attribution, and public-use terms.
- Verify map tile provider policy and weather-overlay API compatibility.
- Decide whether the AI assistant is live in the first public deployment or initially gated behind configuration.
- Update `TRD.md` with the verified choices.

Exit criteria:
- Provider decisions have official documentation links.
- No unresolved licensing or secret-handling issue is being ignored.
- The first implementation scope is agreed.

## Phase 1 — App foundation

**Goal:** Establish a clean, testable application shell.

Tasks:
- Create or verify the React + TypeScript + Vite setup.
- Configure linting, formatting, and tests.
- Add the app shell and route structure.
- Add global tokens, light/dark theme foundations, typography, and responsive layout rules.
- Add shared UI primitives and common loading/error/empty states.
- Add a small validated `lib/storage` helper (used first for the theme; Phase 4 extends it with versioning for locations and preferences).
- Add `.env.example` and ensure real environment files are ignored.
- Fill in the Commands section of `CLAUDE.md`.

Exit criteria:
- App starts locally.
- All planned routes render an intentional placeholder/shell.
- Theme switching works and persists locally.
- Lint, type check, tests, and production build pass.

## Phase 2 — Weather data foundation

**Goal:** Connect one weather provider through a normalized data layer.

Tasks:
- Implement typed location and weather domain models.
- Implement city search and location selection.
- Implement current weather and forecast queries.
- Put provider access behind a `WeatherDataSource` interface with a live Open-Meteo implementation and a snapshot implementation, selected by configuration (TRD §4a, D-18). The snapshot source and recorder script may land at the end of this phase or as a short follow-up task, but the interface must exist from the start.
- Normalize provider responses and handle missing fields.
- Add unit-aware formatting utilities (metric by default; display-time conversion only).
- Configure query keys, caching, retry behavior, and error mapping.
- Add attribution and data freshness labels.

Exit criteria:
- A user can search for a city and see current weather from the selected provider.
- Forecast data uses consistent units and timestamps.
- Missing values and API failures are handled.
- Tests cover normalization and key error cases.

## Phase 3 — Overview and forecast experience

**Goal:** Deliver the main polished weather pages.

Tasks (the owner wants this phase to feel beautiful, alive and information-rich; see `DESIGN_SPEC.md` §9a):
- **3a, visual foundation (done):** self-hosted Plus Jakarta Sans and Fraunces, neutral liquid-glass tokens for both themes, motion rules.
- **3b, live wallpaper (done):** eight real looping weather videos with posters, the scene-mapping module, a crossfading full-screen backdrop with reduced-motion, data-saver and failure fallbacks. (An earlier hand-drawn procedural sky was built, judged to look fake, and removed.)
- **3c, glass shell (done):** floating glass header with an animated nav indicator, floating bottom tab bar on mobile, glass footer, buttons, inputs and search.
- **3d, Overview (done):** hero with animated temperature and weather icon, 24-hour strip, 10-day range bars, interactive temperature and wind charts, and nine widgets (wind compass, humidity, UV, pressure, sun arc, precipitation, visibility, cloud cover, air quality). The data layer was extended for these (UV, pressure, gusts, visibility, dew point, daily extremes, an air-quality source).
- **3e, Forecast (done):** hourly strip, tabbed chart explorer (temperature, rain, wind, UV, humidity, pressure over 24 h, 48 h or 7 days), 10-day list, and data tables as the text equivalent.
- **Still to do in this phase:** an accessibility pass in a real browser (keyboard order, contrast over every scene in both themes), a bundle-size check, and the owner's review of the visual design. Units toggle and saved locations stay in Phase 4.
Exit criteria:
- Overview and forecast use real provider data.
- No mock values appear as live weather.
- Loading, error, empty, and stale-data states are complete.
- Responsive and accessibility checks are performed.

## Phase 4 — Local personalization and city comparison

**Goal:** Make the app useful across multiple locations.

Tasks:
- Add save/remove city behavior.
- Add versioned and validated local storage for locations and preferences.
- Add the unit preference UI (°C/°F, km/h and mph) and apply it consistently, including charts.
- Implement city comparison by reusing the existing data layer.
- Ensure units and timestamps are comparable.

Exit criteria:
- Saved locations persist across reloads in the same browser.
- Malformed storage data does not crash the app.
- Users can compare at least two cities.
- Comparison handles partial failures.

**Built:** units menu and validated preferences; saved locations (cap, dedupe, lenient reads) with a live Locations page; comparison of 2 to 4 cities (D-16) on the same query definition and cache as the Overview (one request per city, no separate API path). Every city has its own loading and error state, so one failure never hides the rest; failed cities show as not available in the table and chart. The table marks highest and lowest with an arrow and a word, not colour alone, and the chart aligns cities by elapsed hours with each city's own local time in the tooltip. Compared cities persist under `atmos:comparison:v1`.

## Phase 5 — Interactive map

**Goal:** Provide a genuinely useful map experience.

Tasks:
- Integrate Leaflet and a compliant map tile provider.
- Add location selection and selected-location details.
- Integrate at least one verified weather overlay.
- Add attribution and clear overlay controls.
- Handle tile and overlay errors.

Exit criteria:
- Pan, zoom, and location selection work.
- Overlay uses a real supported source.
- Attribution and provider terms are respected.
- The map remains usable on narrow screens.

**Built:** a lazy-loaded Leaflet map on OpenStreetMap tiles (dimmed in the dark theme), a RainViewer past-radar overlay with on/off, time slider, play/pause and strength controls, and visible attribution for both providers. Tap or click selects a place, search moves the map to a city, "Select map centre" gives keyboard users the same power, and saved places show as markers. The selected place shows its weather and can be opened in full, saved or compared. Open-Meteo has no reverse geocoding, so a tapped point is named by its coordinates (id pin:lat,lon). A radar outage, bad radar response, failed tiles or failed base tiles each show a message and never break the map.

## Phase 6 — AI weather assistant

**Goal:** Add contextual weather Q&A without compromising security.

Tasks:
- Select runtime AI provider and deployment approach.
- Implement a server-side endpoint and environment configuration.
- Define the assistant service interface.
- Pass selected city and relevant forecast context.
- Validate inputs, limit requests, and handle provider failures.
- Add uncertainty and emergency-guidance boundaries to assistant behavior.

Exit criteria:
- Secrets are not exposed in the client.
- Responses use supplied weather context and do not invent measurements.
- Missing AI configuration is handled honestly.
- Weather pages remain functional when AI is unavailable.

## Phase 7 — Quality and release

**Goal:** Prepare a credible public portfolio release.

Tasks:
- Complete key unit, component, integration, and end-to-end tests.
- Review keyboard navigation, focus, contrast, reduced motion, and responsive layouts.
- Check provider quotas, attribution, and deployment environment variables.
- Verify production routing and build.
- When the live-API trial ends, switch the deployment to snapshot mode by configuration (D-18), confirm snapshots are labeled as recorded data with their capture date, and confirm the live code path still builds and passes its tests.
- Write the final README with setup, configuration, architecture, limitations, and screenshots.

Exit criteria:
- All configured checks pass, or documented blockers remain.
- No secrets are committed.
- Provider terms and attribution are addressed.
- Known limitations are documented honestly.

## First coding session scope

The first Claude session should do **Phase 1 only** (see "Session order" above for what follows), unless the repository already has a working foundation. It must inspect the existing repository before making changes, preserve useful existing code, and avoid building weather features prematurely.
