import { defineConfig } from '@playwright/test'

/**
 * End-to-end tests run against the production build in snapshot mode (the recorded forecasts), so
 * they need no network and give the same result every time. They use the Chrome installed on the
 * machine: no browser download. Run with `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // The pages are heavy (charts, animation); too many at once makes slow machines time out.
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build:snapshot && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
