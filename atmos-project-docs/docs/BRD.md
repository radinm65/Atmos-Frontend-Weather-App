# Business Requirements Document (BRD)

**Product:** Atmos  
**Version:** 1.0  
**Status:** Initial baseline

## 1. Product vision

Atmos is a polished, responsive weather experience that combines cinematic weather photography with useful, easy-to-scan weather information. It should feel like a finished product rather than a generic admin dashboard and demonstrate strong frontend architecture, thoughtful UX, and reliable data handling in a portfolio.

## 2. Target users

- People who want to check current conditions and upcoming weather quickly.
- People who compare weather across multiple cities before making plans.
- Curious users who want to ask plain-language questions about weather data.
- Portfolio reviewers assessing visual quality, accessibility, maintainability, and engineering decisions.

## 3. Objectives

- Present current weather and forecasts clearly.
- Make city search, saving, and comparison fast and intuitive.
- Provide a genuinely interactive map with a useful weather layer.
- Offer an AI assistant that answers using supplied weather context rather than inventing live conditions.
- Support light and dark themes, responsive layouts, and accessible interactions.
- Keep the codebase modular, testable, and suitable for incremental AI-assisted development.

## 4. MVP scope

- Current weather for a selected location.
- Hourly forecast and multi-day forecast, within the chosen provider's plan limits.
- Weather summaries and visualizations.
- Search locations and save/remove favorites.
- Compare multiple cities using consistent fields and units.
- Interactive map with location selection and at least one verified weather overlay.
- AI weather assistant with current context from the app.
- Celsius/Fahrenheit and km/h/mph preferences where supported.
- Light and dark themes.
- Local browser persistence for saved cities and preferences.
- Loading, error, empty, stale-data, and retry states.
- Responsive design and baseline accessibility.
- Tests for important logic and user flows.

## 5. Out of scope for MVP

- User accounts, registration, cloud sync, or cross-device persistence.
- Paid subscriptions or user billing.
- A native mobile app.
- Severe-weather alert delivery guarantees.
- Long-term climate analysis or professional meteorological decision support.
- Building a custom weather data infrastructure.
- A chat assistant that claims to replace official emergency guidance.

## 6. Business requirements

- **BR-01:** The app must show current weather for a selected location.
- **BR-02:** The app must provide hourly and multi-day forecasts to the extent supported by the selected provider.
- **BR-03:** Users must be able to search for and select locations.
- **BR-04:** Users must be able to save and remove locations without creating an account.
- **BR-05:** Users must be able to compare at least two locations using consistent metrics.
- **BR-06:** The app must include an interactive map and a verified weather overlay.
- **BR-07:** The app must include an AI assistant that receives relevant weather context.
- **BR-08:** The app must support light and dark themes and persist the selected theme locally.
- **BR-09:** The app must remain usable on mobile, tablet, and desktop screens.
- **BR-10:** The app must handle API failures, rate limits, and missing data gracefully.
- **BR-11:** API secrets must not be exposed in client-side code or committed to version control.
- **BR-12:** External data sources must be credited and used according to their current terms.

## 7. Success criteria

- A user can search for a city and view its weather without signing in.
- A user can save a city, refresh the page, and still see it saved in the same browser.
- A user can compare multiple cities with consistent units.
- Map interaction and the selected weather overlay work with real data and clear attribution.
- The AI assistant distinguishes supplied data from uncertainty and does not fabricate current conditions.
- Critical routes have loading, error, empty, and responsive states.
- Type checking, linting, tests, and production build run successfully before release.

## 8. Constraints and risks

- Free API quotas and forecast horizons may change or be insufficient.
- Map libraries do not automatically provide map tiles or weather overlays.
- Public tile servers may have usage policies that make them unsuitable for unrestricted production traffic.
- AI model access from the deployed app may require a separate API account and billing, even when a paid chat subscription is available for development.
- Weather conditions and units vary by provider; normalize them in the app's domain layer.
- Browser local storage is local to one browser and can be cleared by the user.

## 9. Assumptions requiring verification

- The chosen weather provider's free tier covers the MVP's forecast horizon, request volume, and intended public portfolio use.
- A suitable map tile provider and weather overlay can be used under their current terms.
- A runtime AI provider and secure server-side endpoint will be selected before enabling live AI responses in a public deployment.
