# Product Requirements Document (PRD)

**Product:** Atmos  
**Version:** 1.0  
**Status:** Initial baseline

## 1. Information architecture

| Route | Purpose |
|---|---|
| `/` | Overview: selected city, current conditions, key metrics, and forecast highlights |
| `/forecast` | Detailed hourly and multi-day forecast |
| `/compare` | Compare weather for multiple cities |
| `/map` | Interactive map with a verified weather layer |
| `/assistant` | Ask questions about weather using app context |
| `/locations` | Manage saved locations |

Navigation should remain clear on desktop and adapt to compact/mobile layouts. A location picker and theme control should be easy to reach from the main app shell.

## 2. Core user stories and acceptance criteria

### US-01 — View current weather
As a user, I want to see the current conditions for a selected city so that I can understand the weather at a glance.

**Acceptance criteria**
- The page shows location name, temperature, condition, and available key metrics.
- Units are consistent throughout the interface.
- Data timestamp or freshness is shown where available.
- Loading, failure, and missing-field states are handled without breaking the layout.

### US-02 — Search for a city
As a user, I want to search locations by name so that I can view the weather somewhere else.

**Acceptance criteria**
- Search results are selectable and distinguish similarly named places using region/country when available.
- Empty results and request failures are explained.
- Keyboard users can operate the search and results.
- A selected location becomes the active location.

### US-03 — Save locations
As a user, I want to save favorite cities without creating an account.

**Acceptance criteria**
- Users can save and remove locations.
- Saved locations persist across reloads in the same browser.
- Invalid or outdated local storage values do not crash the app.
- An empty state explains how to add a location.

### US-04 — Explore forecasts
As a user, I want to inspect hourly and daily forecasts.

**Acceptance criteria**
- Forecast values and labels use consistent units and time zones.
- Missing values are represented clearly rather than as misleading zeroes.
- The UI reflects the actual forecast horizon returned by the chosen provider.
- Forecast visuals have accessible labels or equivalent text.

### US-05 — Compare cities
As a user, I want to compare multiple cities so that I can choose between destinations.

**Acceptance criteria**
- Users can add and remove cities from a comparison.
- At least two cities can be compared.
- Metrics use the same units and comparable timestamps where possible.
- Partial data does not invalidate all other cities' results.
- Loading, error, and empty states are implemented.

### US-06 — Use the weather map
As a user, I want to explore locations on a map and inspect weather information.

**Acceptance criteria**
- The map supports pan and zoom.
- Users can select a location or marker and inspect relevant weather details.
- At least one weather overlay is backed by a real, verified data source.
- Attribution and provider terms are respected.
- The interface handles tile or overlay failures gracefully.

### US-07 — Ask the AI weather assistant
As a user, I want to ask natural-language questions about weather.

**Acceptance criteria**
- The assistant receives relevant selected-city and forecast context from the app.
- It does not invent unavailable measurements or claim data is live when it is not.
- It communicates uncertainty and directs users to official sources for urgent warnings.
- API credentials remain server-side.
- If the AI service is unavailable, the rest of the weather app continues to work.

### US-08 — Change preferences
As a user, I want to select units and a theme.

**Acceptance criteria**
- Light and dark themes are available.
- Theme and unit preferences persist locally.
- Changes are applied consistently across pages and charts.
- Contrast and focus states remain usable in both themes.

### US-09 — Use Atmos on different devices
As a user, I want the app to work on desktop, tablet, and mobile.

**Acceptance criteria**
- Core features remain usable at narrow widths.
- No page requires horizontal scrolling for ordinary content.
- Interactive controls have suitable touch targets.
- Reduced-motion preferences are respected.

### US-10 — Recover from errors
As a user, I want clear feedback when weather services fail.

**Acceptance criteria**
- Errors have human-readable messages and retry actions when appropriate.
- Cached/stale data may be shown only when clearly identified as stale.
- Rate limits and missing provider configuration are handled explicitly.
- One failed widget does not unnecessarily blank the entire page.

## 3. Functional requirements

- A shared location model is used across overview, forecast, comparison, map, and assistant.
- Weather responses are normalized into app-owned domain types.
- Server-state caching and request lifecycle are centralized.
- Saved locations and preferences are validated before being read from local storage.
- Comparison uses the same query/data layer as the overview; it must not implement a separate API path.
- Charts include readable labels, tooltips, and non-visual equivalents where practical.
- AI responses are based on explicit context passed from the app.
- All external services have documented attribution and configuration requirements.

## 4. Non-functional requirements

- Strict TypeScript; avoid `any` unless justified and isolated.
- Components should have focused responsibilities and predictable props.
- Shared styles and design tokens should be centralized.
- Accessible keyboard navigation, focus visibility, semantic structure, and sufficient contrast.
- No API secrets in the frontend bundle or repository.
- Core weather features remain available when AI is unavailable.
- Important business logic and critical user journeys are tested.

## 5. MVP completion gate

The MVP is not complete until the core routes work with real provider data, comparison and saved locations work, the map overlay is verified, AI integration is safely configured or clearly gated, both themes are reviewed, and automated checks pass.
