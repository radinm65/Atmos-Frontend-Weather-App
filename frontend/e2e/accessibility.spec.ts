import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'

/**
 * Automated accessibility checks (axe, WCAG 2.0/2.1 A and AA) on every page, in both themes. Axe
 * cannot judge text over moving footage, so contrast over the video is checked by eye (see the
 * release checklist in the README); everything else it can find must be clean.
 */
const PAGES = ['/', '/forecast', '/compare', '/map', '/assistant', '/locations'] as const
const TOKYO = {
  id: 'om:1850147',
  name: 'Tokyo',
  region: 'Tokyo',
  country: 'Japan',
  latitude: 35.6895,
  longitude: 139.69171,
}

for (const theme of ['dark', 'light'] as const) {
  test.describe(`accessibility, ${theme} theme`, () => {
    test.use({ colorScheme: theme })

    for (const path of PAGES) {
      test(`${path} has no detectable violations`, async ({ page }) => {
        await page.addInitScript(
          ([t, tokyo]) => {
            localStorage.setItem('atmos:theme:v1', JSON.stringify(t))
            localStorage.setItem('atmos:active-location:v1', JSON.stringify(tokyo))
            localStorage.setItem('atmos:comparison:v1', JSON.stringify([tokyo]))
          },
          [theme, TOKYO] as const,
        )
        await page.goto(path)
        await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
        // Let data, charts and entrance animations settle before looking.
        await page.waitForTimeout(2500)

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()

        const summary = results.violations.map(
          (violation) =>
            `${violation.id} (${violation.impact}): ${violation.help}\n` +
            violation.nodes
              .slice(0, 4)
              .map((node) => `    ${node.target.join(' ')}`)
              .join('\n'),
        )
        expect(summary, summary.join('\n')).toEqual([])
      })
    }
  })
}

test('motion is switched off for people who ask for less of it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const animated = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations === Infinity)
      .map((animation) => (animation.effect as KeyframeEffect).target?.className ?? 'unknown')
      .slice(0, 5),
  )
  expect(animated, 'endless animations still running').toEqual([])
})
