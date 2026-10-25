import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WeatherApiError } from '../../lib/api'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { berlinNewHampshire, createFakeSource } from '../../test/fakeSource'
import { renderApp } from '../../test/render'
import { SAVED_LOCATIONS_KEY } from '../locations/savedLocationsStorage'
import { COMPARISON_KEY, loadComparison } from './comparisonStorage'

// Recharts needs real element sizes, which jsdom lacks; chart data helpers are tested separately.
vi.mock('./ComparisonChart', () => ({ default: () => <div data-testid="compare-chart" /> }))
vi.mock('../overview/HourlyChart', () => ({ default: () => <div /> }))
vi.mock('../overview/WindChart', () => ({ default: () => <div /> }))

const tokyo = {
  id: 'om:1850147',
  name: 'Tokyo',
  region: 'Tokyo',
  country: 'Japan',
  latitude: 35.6895,
  longitude: 139.69171,
}

function stored(cities: unknown) {
  window.localStorage.setItem(COMPARISON_KEY, JSON.stringify(cities))
}

describe('Compare page', () => {
  it('asks for cities when none are chosen and offers no table yet', async () => {
    renderApp('/compare', { source: createFakeSource().source })
    expect(await screen.findByRole('heading', { level: 1, name: 'Compare' })).toBeInTheDocument()
    expect(screen.getByText(/Choose at least 2 cities/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('adds cities by search and shows them side by side once two are chosen', async () => {
    renderApp('/compare', { source: createFakeSource().source })
    const search = await screen.findByRole('combobox')

    await userEvent.type(search, 'berlin')
    await userEvent.click(await screen.findByRole('option', { name: /New Hampshire/ }))
    expect(await screen.findByRole('article', { name: 'Berlin' })).toBeInTheDocument()
    expect(screen.getByText(/Add at least 1 more city/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('combobox'), 'berlin')
    await userEvent.click(await screen.findByRole('option', { name: /Germany/ }))

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    expect(await screen.findByTestId('compare-chart')).toBeInTheDocument()
    expect(loadComparison().map((city) => city.id)).toEqual([berlinNewHampshire.id, berlin.id])
  })

  it('restores the chosen cities after a reload', async () => {
    stored([berlin, tokyo])
    renderApp('/compare', { source: createFakeSource().source })
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Berlin' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Tokyo' })).toBeInTheDocument()
  })

  it('uses the same weather requests as everywhere else (one per city)', async () => {
    stored([berlin, tokyo])
    const { source, getWeather } = createFakeSource()
    renderApp('/compare', { source })
    await screen.findByRole('table')
    expect(getWeather).toHaveBeenCalledTimes(2)
  })

  it('removes a city and returns to the hint below two cities', async () => {
    stored([berlin, tokyo])
    renderApp('/compare', { source: createFakeSource().source })
    await screen.findByRole('table')

    await userEvent.click(screen.getByRole('button', { name: 'Remove Tokyo from the comparison' }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Tokyo' })).not.toBeInTheDocument()
    expect(loadComparison().map((city) => city.id)).toEqual([berlin.id])
  })

  it('stops at four cities and explains why', async () => {
    const extra = (n: number) => ({ ...tokyo, id: `om:${n}`, name: `Town ${n}` })
    stored([berlin, tokyo, extra(1), extra(2)])
    renderApp('/compare', { source: createFakeSource().source })
    await screen.findByRole('table')

    expect(screen.getByText(/most cities allowed \(4\)/)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('4 of 4')).toBeInTheDocument()
  })

  it('keeps comparing when one city fails and lets that city retry', async () => {
    stored([berlin, tokyo])
    const { source, getWeather } = createFakeSource()
    const fail = new WeatherApiError('server', 'down')
    getWeather.mockImplementation((location) =>
      location.id === tokyo.id
        ? Promise.reject(fail)
        : createFakeSource().getWeather(location, { signal: new AbortController().signal }),
    )
    renderApp('/compare', { source })

    const failed = await screen.findByRole('article', { name: 'Tokyo' })
    expect(await within(failed).findByRole('alert')).toBeInTheDocument()
    expect(within(failed).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    // The healthy city and the table are still there; the failed city shows as not available.
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Berlin' })).queryByRole('alert')).toBeNull()
    expect(screen.getAllByText('not available').length).toBeGreaterThan(0)
  })

  it('does not crash on corrupted stored data and keeps the good entries', async () => {
    stored([berlin, { name: 'No id' }, 7, null, tokyo])
    renderApp('/compare', { source: createFakeSource().source })
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(loadComparison()).toHaveLength(2)
  })

  it('survives unreadable stored data', async () => {
    window.localStorage.setItem(COMPARISON_KEY, '{oops')
    renderApp('/compare', { source: createFakeSource().source })
    expect(await screen.findByText(/Choose at least 2 cities/)).toBeInTheDocument()
  })

  it('offers saved places for one-tap adding', async () => {
    window.localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify([tokyo]))
    renderApp('/compare', { source: createFakeSource().source })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Add Tokyo to the comparison' }),
    )
    expect(await screen.findByRole('article', { name: 'Tokyo' })).toBeInTheDocument()
  })

  it('shows temperatures in the chosen unit', async () => {
    stored([berlin, tokyo])
    renderApp('/compare', { source: createFakeSource().source })
    await screen.findByRole('table')
    await waitFor(() =>
      expect(
        within(screen.getByRole('table')).getByRole('row', { name: /^Temperature now/ })
          .textContent,
      ).toContain('°C'),
    )

    await userEvent.click(screen.getByRole('button', { name: /Units/ }))
    await userEvent.click(await screen.findByRole('radio', { name: '°F' }))
    await waitFor(() =>
      expect(
        within(screen.getByRole('table')).getByRole('row', { name: /^Temperature now/ })
          .textContent,
      ).toContain('°F'),
    )
  })
})

describe('Saved location cards and the comparison', () => {
  it('adds a saved place to the comparison from the Locations page', async () => {
    window.localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify([tokyo]))
    renderApp('/locations', { source: createFakeSource().source })

    await userEvent.click(await screen.findByRole('button', { name: 'Compare Tokyo' }))
    expect(loadComparison().map((city) => city.id)).toEqual([tokyo.id])
    expect(
      await screen.findByRole('button', { name: 'Remove Tokyo from the comparison' }),
    ).toBeInTheDocument()
  })
})
