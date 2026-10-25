import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Every test starts from a clean browser and never touches the real network except the app itself:
 * map tiles and the radar are answered locally, and the backdrop videos are not downloaded.
 */
export const test = base.extend({
  page: async ({ page }, run) => {
    await page.route(/tile\.openstreetmap\.org|tilecache\.rainviewer\.com/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        // A 1x1 transparent PNG.
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'base64',
        ),
      }),
    )
    await page.route('https://api.rainviewer.com/**', (route) =>
      route.fulfill({
        json: {
          version: '2.0',
          generated: 1_792_939_823,
          host: 'https://tilecache.rainviewer.com',
          radar: {
            past: [
              { time: 1_792_939_200, path: '/v2/radar/aaa111' },
              { time: 1_792_939_800, path: '/v2/radar/bbb222' },
            ],
            nowcast: [],
          },
        },
      }),
    )
    await page.route(/\.mp4$/, (route) => route.abort())
    await run(page)
  },
})

export { expect }

/** Picks a recorded city through the first-run search. */
export async function chooseCity(page: Page, name: string) {
  await page.getByRole('combobox').first().fill(name)
  await page
    .getByRole('option', { name: new RegExp(name) })
    .first()
    .click()
}
