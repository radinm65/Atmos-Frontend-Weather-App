# Credits

Third-party assets bundled with Atmos. Data-provider credits (Open-Meteo, GeoNames) are shown in the app footer; see `PROVIDER_VALIDATION.md`.

## Fonts (self-hosted, SIL Open Font License 1.1)

| Font | Use | Source | Licence |
|---|---|---|---|
| Plus Jakarta Sans (variable, Latin subset) | UI text | https://github.com/tokotype/PlusJakartaSans, file from the `@fontsource-variable/plus-jakarta-sans` package | OFL 1.1, text in `frontend/src/assets/fonts/OFL-plus-jakarta-sans.txt` |
| Fraunces (variable, Latin subset) | Large temperature numerals and headings | https://github.com/undercasetype/Fraunces, file from the `@fontsource-variable/fraunces` package | OFL 1.1, text in `frontend/src/assets/fonts/OFL-fraunces.txt` |

The WOFF2 files were downloaded directly from the packages' published files on jsDelivr (npm installs of these packages failed with network errors on the dev machine) and are unmodified.

## Backdrop videos (Mixkit Stock Video Free License)

Looping real-footage backgrounds, one per weather scene, in `frontend/public/backdrops/` (`<scene>.mp4` at 720p plus a `<scene>.jpg` poster frame). All eight were downloaded unmodified from Mixkit on 2026-10-25, and only clips marked "Download this free stock video clip for commercial or personal use, under the Mixkit Stock Video Free License" were used. Clips marked "personal use only (Mixkit Restricted License)" were deliberately skipped.

| Scene | Clip | Source page |
|---|---|---|
| clear-day | White clouds moving across a clear blue sky quickly (#51105) | https://mixkit.co/free-stock-video/white-clouds-moving-across-a-clear-blue-sky-quickly-51105/ |
| clear-night | Many stars in the night sky (#4124) | https://mixkit.co/free-stock-video/many-stars-in-the-night-sky-4124/ |
| partly-cloudy | Clouds covering the mountains (#4695) | https://mixkit.co/free-stock-video/clouds-covering-the-mountains-4695/ |
| overcast | Misty mountains and clouds (#100190) | https://mixkit.co/free-stock-video/misty-mountains-and-clouds-100190/ |
| fog | Slow aerial tour through a mist-covered forest (#28342) | https://mixkit.co/free-stock-video/slow-aerial-tour-through-a-mist-covered-forest-28342/ |
| rain | Window on a rainy day (#2846) | https://mixkit.co/free-stock-video/window-on-a-rainy-day-2846/ |
| snow | Snowing on the streets of Canada (#3323) | https://mixkit.co/free-stock-video/snowing-on-the-streets-of-canada-3323/ |
| thunderstorm | Thunderstorm at night (#4422) | https://mixkit.co/free-stock-video/thunderstorm-at-night-4422/ |

**Licence summary (Mixkit FAQ and info pages; the full licence text is loaded dynamically and could not be fetched here):** free for commercial and personal projects, no attribution required, no watermark. Mixkit does not let users offer unaltered items to third parties as a stand-alone product. The clips are used here only as part of an application's interface, but they are also present as plain files in a public repository, which is a grey area. If that is a concern, move `public/backdrops/` out of git (a CDN or release asset) or replace the clips; the app only needs the file names above. Mixkit is credited in the app footer even though the licence does not require it.

## Images

No other images are used.
