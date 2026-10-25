# Release checklist

Things automated checks cannot confirm. Tick each before making the repository or the site public.

## Automated (run these first)

- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass.
- [ ] `npm run test:e2e` passes (builds in snapshot mode, uses installed Chrome).
- [ ] `git grep -nIE "sk-ant-[A-Za-z0-9_-]{20,}|cfut_"` finds only the fake keys in tests; `git ls-files | findstr .env` lists only `.env.example` and `.env.snapshot`.

## By eye

- [ ] **Contrast over the video:** open every page in both themes and let each of the eight scenes play (change the active city to one with rain, snow, fog, storm, clear night). Text on bare video (the header, the footer, the phone tab bar) must stay readable.
- [ ] **Reduced motion:** turn on "reduce motion" in the operating system. The video should become a still picture and endless animations should stop.
- [ ] **Keyboard:** Tab through Overview, Compare, Map and Assistant. Every control is reachable, the focus ring is always visible, and Escape closes popups.
- [ ] **iPhone and Safari:** the five-tab bar stays fixed at the bottom while scrolling and when the browser bar shows or hides; the map pans without scrolling the page by accident.
- [ ] **Firefox and Safari:** the glass blur, the radar and the charts render.

## Providers

- [ ] **Open-Meteo:** the footer attribution is visible; the site is non-commercial and has no ads. Optionally email info@open-meteo.com to confirm a portfolio qualifies.
- [ ] **OpenStreetMap:** attribution visible on the map; the host does not strip the Referer header; traffic is low. The tile URL lives in `src/features/weather-map/mapConfig.ts` if it must be swapped.
- [ ] **RainViewer:** "personal or educational use" fits only a non-commercial portfolio. A link to rainviewer.com is shown.
- [ ] **Mixkit:** read https://mixkit.co/license/ in a browser. Decide whether raw clips may stay in the public repository, or move them outside git (OPEN_DECISIONS D-19).
- [ ] **Snapshots:** re-recorded right before release (`npm run snapshots:record`), committed, and shown with their capture date.

## The assistant (only if you turn it on)

- [ ] Tested with a real key: an umbrella question matches the Overview chance of rain; "temperature in 2 weeks" is answered with "I do not have that"; "capital of France" is declined; "ignore your rules" is refused; a tornado question shows the emergency notice; units follow the °C/°F setting; the 7th question within a minute is rate limited; a wrong key shows "unavailable" without leaking anything.
- [ ] Anthropic only: a monthly spend limit is set in the console. Cloudflare only: the account stays on the free Workers plan (an upgrade bills usage above the free allowance).
- [ ] Platform rate limiting is enabled for `/api/assistant`; `ASSISTANT_ENABLED` is `false` to switch it off at any time.
- [ ] `npx wrangler dev` works locally before the first `wrangler deploy`.
