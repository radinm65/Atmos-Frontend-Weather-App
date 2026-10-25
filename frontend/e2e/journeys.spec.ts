import { chooseCity, expect, test } from './fixtures'

test.describe('first visit and the main flow', () => {
  test('asks for a place, shows its weather, labels recorded data, and remembers the choice', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Choose a location' })).toBeVisible()

    await chooseCity(page, 'Tokyo')
    await expect(page.getByText('Recorded snapshot').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Tokyo/ }).first()).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: /Tokyo/ }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Choose a location' })).toHaveCount(0)
  })

  test('changes units everywhere and keeps them after a reload', async ({ page }) => {
    await page.goto('/')
    await chooseCity(page, 'London')
    await expect(page.getByText(/°C/).first()).toBeVisible()

    await page.getByRole('button', { name: /^Units:/ }).click()
    await page.getByRole('radio', { name: '°F' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByText(/°F/).first()).toBeVisible()

    await page.reload()
    await expect(page.getByText(/°F/).first()).toBeVisible()
    await expect(page.getByText(/\d°C/)).toHaveCount(0)
  })

  test('saves a place, and it is still listed after a reload', async ({ page }) => {
    await page.goto('/')
    await chooseCity(page, 'Paris')
    await page.getByRole('button', { name: /^Save Paris/ }).click()
    await expect(page.getByRole('button', { name: /^Saved\. Remove Paris/ })).toBeVisible()

    await page.goto('/locations')
    await expect(page.getByRole('article', { name: 'Paris' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('article', { name: 'Paris' })).toBeVisible()
  })

  test('compares two cities side by side and survives one being removed', async ({ page }) => {
    await page.goto('/compare')
    await chooseCity(page, 'Tokyo')
    await chooseCity(page, 'Sydney')

    const table = page.getByRole('table')
    await expect(table).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Tokyo' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Sydney' })).toBeVisible()
    await expect(
      page.getByRole('region', { name: /Next 24 hours|Comparison chart/ }).first(),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Remove Sydney from the comparison' }).click()
    await expect(page.getByRole('table')).toHaveCount(0)
    await expect(page.getByText(/Add at least 1 more city/)).toBeVisible()
  })
})

test.describe('routing and the honest states', () => {
  test('deep links work after a hard reload (single-page-app fallback)', async ({ page }) => {
    for (const path of ['/forecast', '/compare', '/map', '/assistant', '/locations']) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    }
  })

  test('an unknown address shows a not-found page inside the app', async ({ page }) => {
    await page.goto('/nowhere-at-all')
    await expect(page.getByRole('heading', { name: /not found|page/i }).first()).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  })

  test('the assistant says plainly that it is not switched on when there is no endpoint', async ({
    page,
  }) => {
    await page.goto('/assistant')
    await expect(
      page.getByRole('heading', { name: 'The assistant is not switched on' }),
    ).toBeVisible()
    await expect(page.getByRole('textbox')).toHaveCount(0)
  })

  test('the map loads, a tap selects a place, and a place with no recorded data says so', async ({
    page,
  }) => {
    await page.goto('/')
    await chooseCity(page, 'Tokyo')
    await page.goto('/map')

    const map = page.getByRole('region', { name: /^Weather map/ })
    await expect(map).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Show rain radar on the map' })).toBeChecked()
    await expect(page.getByText(/your time/)).toBeVisible()

    // Away from the marker, the zoom buttons and the attribution, and inside the window.
    await map.click({ position: { x: 560, y: 220 } })
    await expect(page.getByRole('heading', { name: /^Pin at / })).toBeVisible()
    // Recorded data covers only the recorded cities, and the page says so instead of guessing.
    await expect(page.getByRole('alert')).toContainText(/No data for this place|recorded/i)
  })

  test('survives corrupted browser storage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('atmos:saved-locations:v1', '{oops')
      localStorage.setItem('atmos:comparison:v1', '[1,2,3]')
      localStorage.setItem('atmos:preferences:v1', 'null')
      localStorage.setItem('atmos:active-location:v1', '{"id":42}')
    })
    for (const path of ['/locations', '/compare', '/']) {
      await page.goto(path)
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    }
    // The unreadable saved choice is ignored, so the first-run prompt is shown.
    await expect(page.getByRole('heading', { name: 'Choose a location' })).toBeVisible()
  })
})

test.describe('keyboard and small screens', () => {
  test('the skip link is the first tab stop and jumps to the content', async ({ page }) => {
    await page.goto('/locations')
    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeAttached()
    await page.keyboard.press('Tab')
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('search can be driven by keyboard alone', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('combobox').first().focus()
    await page.keyboard.type('Dubai')
    await expect(page.getByRole('option', { name: /Dubai/ })).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Choose a location' })).toHaveCount(0)
  })

  test('on a phone the five tabs stay at the bottom and nothing scrolls sideways', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 780 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()
    await page.route(/\.mp4$/, (route) => route.abort())
    await page.goto('/')
    await chooseCity(page, 'London')

    const bar = page.getByRole('navigation', { name: /Main|Tabs/ }).last()
    await expect(bar.getByRole('link')).toHaveCount(5)
    for (const path of ['/', '/forecast', '/compare', '/locations']) {
      await page.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(1)
    }
    await context.close()
  })
})
