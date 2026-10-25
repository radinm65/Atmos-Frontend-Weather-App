import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '../test/render'

describe('routes', () => {
  it.each([
    ['/', 'Overview'],
    ['/forecast', 'Forecast'],
    ['/compare', 'Compare'],
    ['/map', 'Map'],
    ['/assistant', 'Assistant'],
    ['/locations', 'Locations'],
  ])('renders a page at %s', async (path, heading) => {
    renderApp(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    // The title is set in an effect, which can run just after the heading first appears.
    await waitFor(() => expect(document.title).toBe(`${heading} · Atmos`))
  })

  it('renders a not-found state for unknown paths inside the shell', async () => {
    renderApp('/nope')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })
})

describe('app shell', () => {
  it('links to every route and marks the active one', async () => {
    renderApp('/forecast')
    const nav = await screen.findByRole('navigation', { name: 'Main' })
    for (const name of ['Overview', 'Forecast', 'Compare', 'Map', 'Assistant', 'Locations']) {
      expect(nav).toHaveTextContent(name)
    }
    expect(screen.getByRole('link', { name: 'Forecast' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  })

  it('navigates between routes', async () => {
    renderApp('/')
    await userEvent.click(await screen.findByRole('link', { name: 'Compare' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Compare' })).toBeInTheDocument()
  })

  it('keeps Locations out of the compact tab bar but reachable from the location picker', async () => {
    renderApp('/')
    const locationsTab = within(await screen.findByRole('navigation', { name: 'Main' })).getByRole(
      'link',
      { name: 'Locations' },
    )
    expect(locationsTab.closest('li')?.className).toContain('desktopOnly')

    await userEvent.click(screen.getByRole('button', { name: /choose location/i }))
    expect(screen.getByRole('link', { name: 'Manage saved locations' })).toHaveAttribute(
      'href',
      '/locations',
    )
  })

  it('keeps the navigation inside the header on wide screens', async () => {
    renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Main' })
    expect(nav.closest('header')).not.toBeNull()
  })

  it('renders the tab bar directly in <body> on phones, outside the header and every wrapper', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    try {
      renderApp('/')
      const nav = await screen.findByRole('navigation', { name: 'Main' })
      expect(nav.parentElement).toBe(document.body)
      expect(nav.closest('header')).toBeNull()
      // Still the same five tabs plus the hidden Locations entry, with the active one marked.
      expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute(
        'aria-current',
        'page',
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('offers a skip link, a theme toggle and data attribution', async () => {
    renderApp('/')
    expect(await screen.findByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getByRole('button', { name: /switch to .* theme/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open-Meteo.com' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    )
    expect(screen.getByRole('link', { name: 'GeoNames' })).toBeInTheDocument()
  })
})
