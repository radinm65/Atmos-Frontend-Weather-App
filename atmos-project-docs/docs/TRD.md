# Technical Requirements Document (TRD)

**Product:** Atmos  
**Version:** 1.1  
**Status:** Proposed architecture; provider verification required

## 1. Proposed stack

- React + TypeScript + Vite
- React Router
- TanStack Query for remote/server state
- React Context or focused local state for app-wide client preferences
- CSS Modules and CSS custom properties
- Recharts for charts
- Leaflet for interactive maps
- Lucide React for icons
- Vitest + React Testing Library
- Playwright for critical end-to-end flows
- ESLint + Prettier
- Zod (recommended, added in Phase 2) for runtime validation of provider payloads and local storage

Do not add libraries without a concrete requirement. The project does not require Tailwind, Docker, or a backend framework solely for the sake of using one.

## 2. Proposed project structure

```text
atmos/
├── docs/
│   ├── BRD.md
│   ├── PRD.md
│   ├── DESIGN_SPEC.md
│   ├── TRD.md
│   ├── AI_RULES.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── OPEN_DECISIONS.md
│   ├── CLAUDE_START_PROMPT.md
│   └── CREDITS.md          (added with the first third-party asset)
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   ├── features/
│   │   ├── overview/
│   │   ├── forecast/
│   │   ├── locations/
│   │   ├── comparison/
│   │   ├── weather-map/
│   │   ├── assistant/
│   │   └── preferences/
│   ├── hooks/
│   ├── lib/
│   │   ├── api/
│   │   ├── config/
│   │   ├── formatting/
│   │   └── storage/
│   ├── domain/
│   │   ├── weather.ts
│   │   ├── location.ts
│   │   └── preferences.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── themes.css
│   │   └── global.css
│   ├── test/
│   └── main.tsx
├── server/
│   └── api/
│       └── assistant.ts
├── CLAUDE.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

The `server/api/assistant.ts` path is illustrative. The actual serverless/API layout depends on the eventual deployment platform. Do not create a pretend secure endpoint that only runs in the browser.

## 3. Domain model

Normalize provider-specific payloads into app-owned types. Prefer `number | null` for optional measurements; do not turn missing values into zero.

```ts
export interface Location {
  id: string;
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  location: Location;
  temperature: number | null;
  feelsLike: number | null;
  condition: string;
  humidity: number | null;
  windSpeed: number | null;
  precipitation: number | null;
  observedAt: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number | null;
  precipitationProbability: number | null;
  condition: string | null;
}

export interface DailyForecast {
  date: string;
  minTemperature: number | null;
  maxTemperature: number | null;
  condition: string | null;
  precipitationProbability: number | null;
}
```

Refine types after confirming the selected provider's actual schema. Validate external payloads at the API boundary.

## 4. Data and API architecture

- Keep provider-specific HTTP calls in a dedicated API module.
- Convert provider responses into domain types in one place.
- Components must not depend directly on raw provider payloads.
- Centralize query keys, stale times, retry rules, and error normalization.
- Reuse the same weather query layer for overview, comparison, map details, and assistant context.
- Abort or ignore obsolete search requests where appropriate.
- Handle rate limits and partial responses explicitly.
- Display data freshness and distinguish stale cached data from fresh data.
- Units: domain values are metric; convert only at display time in one formatting module (OPEN_DECISIONS D-10).
- Time: show times in the selected location's time zone and label it; never silently use the browser's zone for forecast data (D-11).

## 5. Weather provider

WeatherAPI.com is a candidate for the initial implementation because the proposed free tier may fit basic current-weather and short-range forecast needs. Before integrating, verify its current official plan limits, forecast horizon, allowed use, attribution requirements, rate limits, and required API key handling. If the requirements do not fit, compare against Open-Meteo and select based on documented evidence.

Never assume that a provider's free tier is unlimited or that all features are free.

**Key handling:** any key used directly from the browser is public (including `VITE_*` variables), so BR-11 is only satisfied by a keyless provider, a provider-approved restricted key, or by routing weather calls through the same server/serverless layer as the assistant. Decide this in Phase 0 (OPEN_DECISIONS D-05, D-06).

## 6. Map architecture

- Leaflet provides map interaction, not map tiles or weather data.
- Select a base tile provider separately and follow its current usage policy and attribution rules.
- Verify the source, availability, refresh behavior, licensing, and terms for every weather overlay.
- The MVP requires at least one real, working weather overlay; a decorative layer or static screenshot does not satisfy this requirement.
- Keep map tile and overlay configuration separate from map UI components.
- Gracefully handle tile and overlay failures.
- If a provider's terms are unsuitable for public deployment, choose another provider rather than ignoring the terms.

## 7. AI assistant architecture

- Keep a provider-neutral assistant service interface.
- Runtime model calls must be made from a server-side or serverless endpoint.
- Never expose AI API keys in client bundles or commit secrets.
- Pass only relevant selected-location and forecast context.
- Validate user input and impose reasonable request/time limits.
- Handle provider errors and unavailable credentials without breaking the rest of the app.
- The developer's paid Claude chat plan may help author code, but it must not be treated as runtime API access for the deployed app. Runtime AI provider and billing/access need a separate decision.
- If live AI is not configured during early development, use an explicit disabled/configuration state; do not fake an AI response and present it as real.

## 8. Local persistence

- Persist saved locations and user preferences in local storage.
- Use a versioned storage key or migration strategy.
- Validate parsed values and recover safely from malformed data.
- Do not store secrets or sensitive data.
- Explain through UI copy or documentation that data is browser-local and does not sync across devices.

## 9. Testing and quality

- Unit tests for formatting, unit conversion, normalization, storage validation, and query/error helpers.
- Component tests for search, saved locations, theme switching, and empty/error states.
- Integration tests for weather data flow and comparison behavior.
- End-to-end tests for a critical happy path and key failure states.
- Before claiming completion, run and report actual results for lint, type check, tests, and production build where configured.

## 9a. Performance

- Lazy-load routes; the map (Leaflet), charts (Recharts) and assistant routes must not be in the initial bundle.
- Photography follows DESIGN_SPEC §9: responsive sizes, modern formats, explicit dimensions, placeholders.
- Avoid layout shift while data loads (skeletons with stable dimensions).
- Check bundle size in Phase 7 and record the result.

## 10. Environment variables

Commit `.env.example` with placeholder names only. Keep real `.env` files ignored by Git. Public client variables are not secret; any provider key requiring secrecy must be handled server-side or through a provider-approved restricted-key setup.

## 11. Deployment

Choose deployment after deciding how the assistant server endpoint will run. Confirm SPA routing, environment variables, CORS (if relevant), API restrictions, and attribution. Do not assume a Vite static deployment can securely host server-side secrets.
