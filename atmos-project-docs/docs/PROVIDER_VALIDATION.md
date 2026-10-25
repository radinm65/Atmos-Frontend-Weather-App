# Provider Validation (Phase 0)

**Checked:** 2026-10-24 · **Status:** Findings and recommendations. Nothing here is a final decision until the owner confirms it in `OPEN_DECISIONS.md`. No integration code was written.

**Evidence labels**

- **Official** — read on the provider's own page during this session.
- **Tested** — confirmed by a real request from the development machine.
- **Secondary** — a search summary or third-party page. Re-check before relying on it.
- **Unverified** — could not be read; do not treat as confirmed.

Limits and terms change. Re-check the linked pages before the public release (Phase 7).

## 1. Weather and geocoding — Open-Meteo (recommended, D-05 / D-06)

| Item | Finding | Evidence |
|---|---|---|
| Key | None needed for the free API. | Official: [pricing](https://open-meteo.com/en/pricing) |
| Limits (free) | 600/min, 5,000/h, 10,000/day, 300,000/month. Per IP and per application. | Official: [pricing](https://open-meteo.com/en/pricing), [terms](https://open-meteo.com/en/terms) |
| Use | Free API is **non-commercial only**. Examples that qualify: private or non-profit sites with no subscriptions or ads; educational content. Sites with ads or subscriptions are commercial. Voluntary donations are allowed. | Official: [terms](https://open-meteo.com/en/terms) |
| Portfolio fit | Not addressed by name. A no-ads, no-subscription portfolio fits the listed examples, but this is an inference. Optional: ask `info@open-meteo.com`. | Official (silence) |
| Attribution | Data is CC BY 4.0. Credit with a link where the data is shown; example text "Weather data by Open-Meteo.com". Geocoding results are based on GeoNames, which must be credited. | Official: [geocoding docs](https://open-meteo.com/en/docs/geocoding-api); wording from [licence page](https://open-meteo.com/en/licence) via Secondary summary (the page itself could not be fetched directly) |
| Forecast horizon | `forecast_days` 0–16 (default 7). A request for 16 days returned 16 daily entries. | Official: [docs](https://open-meteo.com/en/docs); Tested |
| Variables | Hourly/daily temperature, apparent temperature, humidity, wind, precipitation, precipitation probability, `weather_code` (WMO), `is_day`. `current=` block from 15-minute model data. `timezone=auto` resolves the location's zone. | Official: [docs](https://open-meteo.com/en/docs) |
| Browser calls (CORS) | `Access-Control-Allow-Origin: *` on both forecast and geocoding endpoints. | Tested |
| Geocoding | `https://geocoding-api.open-meteo.com/v1/search`, `name`, `count` (max 100), `language`; results include `id`, `name`, `latitude`, `longitude`, `timezone`, `country`, `admin1`. | Official: [geocoding docs](https://open-meteo.com/en/docs/geocoding-api) |
| Hosting caveat | Limits are per IP. Shared hosts (Vercel, Netlify, Render) may hit them sooner if calls are proxied through them; direct browser calls give each visitor their own IP. | Official: [terms](https://open-meteo.com/en/terms) |

**Alternative checked — WeatherAPI.com** ([pricing](https://www.weatherapi.com/pricing.aspx), Official): free plan is 100,000 calls/month, **3-day forecast only**, 95.5% uptime, key required. Link-back is requested, not mandatory. Use on public websites is not stated. A key used from the browser is public (BR-11). Not recommended: shorter horizon and a key problem.

**Recommendation:** Open-Meteo for weather and geocoding, called directly from the browser. Being keyless, it satisfies BR-11 for weather without a server layer. Show the attribution in the UI footer and on the data freshness label. Keep all HTTP in `lib/api` so the provider can be swapped.

**Residual risks:** non-commercial-only terms (do not add ads or subscriptions); no uptime guarantee; limits can change.

## 2. Map base tiles (D-07)

**OpenStreetMap standard tiles** ([policy](https://operations.osmfoundation.org/policies/tiles/), Official): allowed on public websites under conditions. Visible "© OpenStreetMap contributors" attribution linked to the copyright page; browsers must send a valid Referer (do not set a Referrer-Policy that strips it); no bulk download or prefetching; `https` only; availability is best-effort with no SLA, heavy use is discouraged, and access can be blocked without notice.

**CARTO basemaps** ([styles repo](https://github.com/CartoDB/basemap-styles), Official): raster tiles require a free key (a key in the browser is public); free for non-commercial use up to 5M tiles/month. "Non-commercial" is not defined on that page; the binding terms are at carto.com/legal/basemap-terms (not read).

**Recommendation:** OSM standard tiles for the MVP, configured through one tile-source module so the URL can be swapped for CARTO or a commercial provider without touching UI code. Expected portfolio traffic is low. Record the risk in the README.

## 3. Weather overlay (D-08) — the least certain area

**RainViewer radar (best fit, terms unverified).**
- **Tested:** `https://api.rainviewer.com/public/weather-maps.json` responds with `Access-Control-Allow-Origin: *`, host `https://tilecache.rainviewer.com`, 13 past radar frames and **0 nowcast frames**. No key needed.
- **Secondary** (search summaries of rainviewer.com pages, [API page](https://rainviewer.com/api.html), [transition FAQ](https://rainviewer.com/api/transition-faq.html)): since 2026-01-01 the free tier is limited to max zoom 7, one colour scheme, no satellite, no nowcast, 100 requests/IP/minute; path identifiers became hashes in March 2026; attribution to RainViewer is mandatory; use is described as "personal and educational" (the FAQ adds "small-scale community"). The two statements are not identical.
- **Verified in Phase 5 (2026-10-25, primary source rainviewer.com/api.html and /api/transition-faq.html):** *Terms of Use*: "The API is free for personal or educational use. We do not guarantee the availability of radar data." and "We kindly ask you to mention the RainViewer API as a source of the data on your website with a link". The FAQ says the free tier targets "personal, educational, and small community projects" and is "not intended for high-volume commercial applications"; "abuse may result in your IP being blocked". Conclusion: a **non-commercial portfolio project qualifies**; a commercial or high-traffic site does not (contact RainViewer for terms). Images may be restyled. The page text says nowcast frames exist, but the live API returned none, so the app uses past radar only.
- **Consequences:** only past radar (about the last two hours), not a forecast. Leaflet must cap native zoom at 7 (`maxNativeZoom: 7`). Show attribution. Handle the 100/min limit by loading only the current frame by default. **Built that way:** 512px tiles (a quarter of the requests of 256px), the newest frame only until the user scrubs or plays, playback limited to the newest 6 frames at about one frame per second, at most 6 frames kept on the map. Measured in Chrome: an 8-second playback requested about 30 tiles, all HTTP 200.

**OpenWeather weather map tiles (fallback).** [Weather Maps 1.0](https://openweathermap.org/api/weathermaps) (Official): global layers `clouds_new`, `precipitation_new`, `pressure_new`, `wind_new`, `temp_new`; tile URL needs `?appid=<key>`. The [price page](https://openweathermap.org/price) lists "Weather Maps (15 layers)" on the free plan with 60 calls/minute and 1,000,000 calls/month (account-wide). Self-service plans require visible attribution to OpenWeather (ODbL), per the [detailed pricing page](https://openweathermap.org/full-price) (Secondary snippet). Problems: the key would be public in tile URLs, and one map view can load a dozen or more tiles, so 60 calls/minute is shared by all visitors. Using it safely needs a caching proxy (see §5), which adds server work.

**Other candidates, not evaluated in depth:** NASA GIBS (no key, public data; asks for acknowledgment; satellite imagery rather than precipitation radar; usage policy not read).

**Recommendation:** Plan Phase 5 around RainViewer past-radar, but make confirming its terms the first task of that phase (read the terms from a network that can reach rainviewer.com, or email them). If a public portfolio is not permitted, fall back to OpenWeather tiles through a caching proxy. Do not call the overlay "working" until it is integrated and tested (AI_RULES §5).

## 4. AI assistant (D-14)

- A paid Claude chat plan does not include runtime API access; the API is billed separately on the developer platform ([pricing](https://platform.claude.com/docs/en/about-claude/pricing), Official for prices; separate billing is also stated in AI_RULES §5).
- Current API prices read from that page, per million tokens (input / output): Claude Haiku 5.5 $0.10 / $0.50 (prompts up to 100k tokens); Claude Sonnet 5.5 $2 / $10; Claude Opus 5.5 $4 / $20.
- A weather question with a small forecast context is on the order of a few thousand tokens, so a Haiku-class model would cost fractions of a cent per question. Even so, an **unauthenticated public endpoint needs a spend cap and rate limiting**, or it can be abused.
- The browser must never hold the key. A server/serverless endpoint is required (TRD §7).

**Recommendation:** Build the assistant behind configuration. Ship it **disabled by default** (explicit "assistant not configured" state) until the owner creates an API account, sets a monthly spend limit, and the endpoint has per-IP rate limiting and input-size limits. This is an allowed outcome per D-14. The owner decides provider and budget.

## 5. Deployment (D-15)

- The app is a static SPA plus one small endpoint (assistant, and optionally a tile proxy).
- Cloudflare Workers supports static assets with SPA fallback via `not_found_handling: "single-page-application"` ([docs](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), Official via search results). Free plan: 100,000 Worker requests/day, 10 ms CPU per invocation, static asset requests free and unlimited ([pricing](https://developers.cloudflare.com/workers/platform/pricing/), Official). How secrets are set on the free plan was not confirmed here.
- Open-Meteo's terms mention Cloudflare Workers as friendlier to its per-user limits than other shared hosts (Official: [terms](https://open-meteo.com/en/terms)), though weather calls are direct from the browser in this plan.

**Recommendation:** Cloudflare (Workers with static assets) as the first candidate, to be confirmed before Phase 6. Alternatives such as Vercel or Netlify also support SPA routing and serverless functions; compare when deciding.

## 6. First implementation scope (Phase 0 exit criterion)

Agreed with the owner on 2026-10-24:

1. Phases 2–5 use Open-Meteo (weather and geocoding, direct from browser) and OSM tiles; no secrets are needed for them (D-05, D-06, D-07).
2. The RainViewer overlay needs its terms confirmed first in Phase 5; OpenWeather via a caching proxy is the fallback (D-08).
3. The assistant is built but ships disabled by default until the owner supplies an AI account, budget, and rate limiting (D-14).
4. The data layer supports a live API trial followed by recorded static snapshots, keeping the API code (D-18, TRD §4a).
5. No `.env` values are required until the assistant phase.

## 7. Still open for the owner

- Open-Meteo portfolio eligibility is an inference. Optionally email `info@open-meteo.com` to confirm a no-ads, no-subscription portfolio qualifies as non-commercial.
- Trial details for D-18: length, which cities to record and how often, whether search is limited to recorded cities afterwards, and whether the public deployment defaults to snapshot mode.
- Runtime AI provider/model and budget (rest of D-14), before Phase 6.
- Deployment platform (D-15), before Phase 6.
- Photography source (D-13) and fonts (D-04), before Phase 3.
