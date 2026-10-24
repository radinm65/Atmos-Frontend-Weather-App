import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { WeatherReport } from '../../domain/weather'
import { WeatherApiError } from '../../lib/api'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { createFakeSource, fixtureReport } from '../../test/fakeSource'
import { createTestQueryClient, renderApp } from '../../test/render'
import { ACTIVE_LOCATION_KEY } from '../locations/activeLocationStorage'

function saveActiveLocation() {
  window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
}

describe('first run', () => {
  it('asks for a location and makes no weather request', async () => {
    const { getWeather } = createFakeSource()
    renderApp('/', { source: createFakeSource().source })
    expect(await screen.findByRole('heading', { name: 'Choose a location' })).toBeInTheDocument()
    expect(getWeather).not.toHaveBeenCalled()
  })

  it('searches, selects a city, then shows its current weather', async () => {
    const fake = createFakeSource()
    renderApp('/', { source: fake.source })

    await userEvent.type(await screen.findByRole('combobox'), 'berlin')
    await userEvent.click((await screen.findAllByRole('option'))[0]!)

    expect(await screen.findByRole('heading', { name: 'Berlin', level: 2 })).toBeInTheDocument()
    expect(fake.getWeather).toHaveBeenCalledOnce()
    expect(fake.getWeather.mock.calls[0]?.[0].id).toBe('om:2950159')

    const conditions = screen.getByRole('region', { name: 'Berlin' })
    expect(within(conditions).getByText('9°C')).toBeInTheDocument()
    expect(within(conditions).getByText('Overcast')).toBeInTheDocument()
    expect(within(conditions).getByText('7°C')).toBeInTheDocument() // feels like 6.5, rounded
    expect(within(conditions).getByText('82%')).toBeInTheDocument()
    expect(within(conditions).getByText('14 km/h')).toBeInTheDocument()
    expect(within(conditions).getByText('0 mm')).toBeInTheDocument()
  })
})

describe('overview with a saved location', () => {
  it('shows a loading state, then the data with a freshness label in the location time zone', async () => {
    saveActiveLocation()
    let resolve!: (report: WeatherReport) => void
    const pending = new Promise<WeatherReport>((r) => (resolve = r))
    const { source } = createFakeSource({ getWeather: vi.fn(() => pending) })
    renderApp('/', { source })

    // The router's own "Loading Atmos" fallback can appear first, so wait for this page's text.
    expect(await screen.findByText('Loading weather for Berlin')).toBeInTheDocument()
    await act(async () => resolve(fixtureReport()))

    expect(await screen.findByText(/Observed Sat 24 Oct, 18:00 \(Europe\/Berlin\)/)).toBeVisible()
    expect(screen.queryByText(/Recorded snapshot/)).not.toBeInTheDocument()
  })

  it('explains a failure and recovers when retried', async () => {
    saveActiveLocation()
    const getWeather = vi
      .fn()
      .mockRejectedValueOnce(new WeatherApiError('rate-limit', 'limited', { status: 429 }))
      .mockResolvedValue(fixtureReport())
    renderApp('/', { source: createFakeSource({ getWeather }).source })

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Overcast')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps old data on screen, marked out of date, when a refresh fails', async () => {
    saveActiveLocation()
    const getWeather = vi
      .fn()
      .mockResolvedValueOnce(fixtureReport())
      .mockRejectedValue(new WeatherApiError('network', 'offline'))
    const queryClient = createTestQueryClient()
    renderApp('/', { source: createFakeSource({ getWeather }).source, queryClient })

    expect(await screen.findByText('Overcast')).toBeInTheDocument()
    await act(async () => {
      await queryClient.refetchQueries()
    })

    expect(await screen.findByText(/Out of date/)).toBeInTheDocument()
    expect(screen.getByText('Overcast')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a dash with "not available" for missing values, never a zero', async () => {
    saveActiveLocation()
    const report = fixtureReport()
    report.current = {
      ...report.current,
      temperature: null,
      feelsLike: null,
      humidity: null,
      windSpeed: null,
      precipitation: null,
    }
    renderApp('/', {
      source: createFakeSource({ getWeather: vi.fn().mockResolvedValue(report) }).source,
    })

    const conditions = await screen.findByRole('region', { name: 'Berlin' })
    expect(within(conditions).getAllByText('not available')).toHaveLength(5)
    expect(within(conditions).queryByText(/^0/)).not.toBeInTheDocument()
  })

  it('labels recorded snapshots as saved data, not current conditions', async () => {
    saveActiveLocation()
    const report: WeatherReport = {
      ...fixtureReport(),
      source: { kind: 'snapshot', capturedAt: '2026-10-24T16:05:00.000Z' },
      fetchedAt: '2026-10-24T16:05:00.000Z',
    }
    renderApp('/', {
      source: createFakeSource({
        kind: 'snapshot',
        getWeather: vi.fn().mockResolvedValue(report),
      }).source,
    })

    expect(await screen.findByText('Recorded snapshot')).toBeInTheDocument()
    expect(screen.getByText(/not current conditions/)).toBeInTheDocument()
    expect(screen.queryByText(/Observed/)).not.toBeInTheDocument()
  })
})

describe('forecast page', () => {
  it('shows hourly and daily tables in the location time zone, reflecting the returned horizon', async () => {
    saveActiveLocation()
    renderApp('/forecast', { source: createFakeSource().source })

    expect(await screen.findByRole('heading', { name: '3-day forecast' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Time (Europe/Berlin)' })).toBeInTheDocument()

    const daily = screen.getByRole('table', { name: 'Daily forecast for Berlin' })
    const rows = within(daily).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Sat 24 Oct')
    expect(rows[1]).toHaveTextContent('Light rain')
    expect(rows[1]).toHaveTextContent('12°C')
    expect(rows[1]).toHaveTextContent('7°C')
    expect(rows[1]).toHaveTextContent('88%')
    expect(rows[1]).toHaveTextContent('1.2 mm')
    // The third day has no values: they must read as unavailable, not as 0.
    expect(rows[3]).toHaveTextContent('Mon 26 Oct')
    expect(within(rows[3]!).getAllByText('not available').length).toBeGreaterThanOrEqual(4)
  })

  it('prompts for a location when none is chosen', async () => {
    renderApp('/forecast', { source: createFakeSource().source })
    expect(await screen.findByRole('heading', { name: 'Choose a location' })).toBeInTheDocument()
  })
})
