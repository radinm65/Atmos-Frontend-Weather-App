import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Providers } from './providers'
import { routes } from './router'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  )
}

describe('routes', () => {
  it.each([
    ['/', 'Overview'],
    ['/forecast', 'Forecast'],
    ['/compare', 'Compare'],
    ['/map', 'Map'],
    ['/assistant', 'Assistant'],
    ['/locations', 'Locations'],
  ])('renders a placeholder page at %s', async (path, heading) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    // The title is set in an effect, which can run just after the heading first appears.
    await waitFor(() => expect(document.title).toBe(`${heading} · Atmos`))
  })

  it('renders a not-found state for unknown paths inside the shell', async () => {
    renderAt('/nope')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })
})

describe('app shell', () => {
  it('links to every route and marks the active one', async () => {
    renderAt('/forecast')
    const nav = await screen.findByRole('navigation', { name: 'Main' })
    for (const name of ['Overview', 'Forecast', 'Compare', 'Map', 'Assistant', 'Locations']) {
      expect(nav).toHaveTextContent(name)
    }
    expect(screen.getByRole('link', { name: 'Forecast' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  })

  it('navigates between routes', async () => {
    renderAt('/')
    await userEvent.click(await screen.findByRole('link', { name: 'Compare' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Compare' })).toBeInTheDocument()
  })

  it('keeps Locations reachable from the header chip, and out of the compact tab bar', async () => {
    renderAt('/')
    const chip = await screen.findByRole('link', { name: 'No location selected' })
    expect(chip).toHaveAttribute('href', '/locations')
    const locationsTab = within(screen.getByRole('navigation', { name: 'Main' })).getByRole(
      'link',
      { name: 'Locations' },
    )
    expect(locationsTab.closest('li')?.className).toContain('desktopOnly')
  })

  it('offers a skip link and a theme toggle', async () => {
    renderAt('/')
    expect(await screen.findByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getByRole('button', { name: /switch to .* theme/i })).toBeInTheDocument()
  })
})
