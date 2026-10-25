import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { WeatherReport } from '../../domain/weather'
import { WeatherApiError } from '../../lib/api'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { createFakeSource, fixtureReport } from '../../test/fakeSource'
import { createTestQueryClient, renderApp } from '../../test/render'
import { ACTIVE_LOCATION_KEY } from '../locations/activeLocationStorage'

// Recharts needs real element sizes, which jsdom does not have. The chart data helpers are
// tested on their own (chartData.test.ts); here the charts are stand-ins.
vi.mock('../overview/HourlyChart', () => ({
  default: () => <div data-testid="hourly-chart" />,
}))
vi.mock('../overview/WindChart', () => ({
  default: () => <div data-testid="wind-chart" />,
}))

function saveActiveLocation() {
  window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
}

const hero = () => screen.findByRole('region', { name: 'Berlin' })

/** The widget (article) whose title is `name`. */
function widget(name: string): HTMLElement {
  const article = screen.getByRole('heading', { level: 3, name }).closest('article')
  if (!article) throw new Error(`No widget titled ${name}`)
  return article
}

describe('first run', () => {
  it('asks for a location and makes no weather request', async () => {
    const fake = createFakeSource()
    renderApp('/', { source: fake.source })
    expect(await screen.findByRole('heading', { name: 'Choose a location' })).toBeInTheDocument()
    expect(fake.getWeather).not.toHaveBeenCalled()
  })

  it('searches, selects a city, then shows its weather', async () => {
    const fake = createFakeSource()
    renderApp('/', { source: fake.source })

    await userEvent.type(await screen.findByRole('combobox'), 'berlin')
    await userEvent.click((await screen.findAllByRole('option'))[0]!)

    const card = await hero()
    expect(fake.getWeather).toHaveBeenCalledOnce()
    expect(fake.getWeather.mock.calls[0]?.[0].id).toBe('om:2950159')
    expect(card).toHaveTextContent('9°')
    expect(card).toHaveTextContent('Overcast')
    expect(card).toHaveTextContent('H 12°')
    expect(card).toHaveTextContent('L 7°')
    expect(card).toHaveTextContent('Feels like 7°')
  })
})

describe('overview dashboard', () => {
  it('shows the hero, hourly strip, outlook, charts and every detail widget', async () => {
    saveActiveLocation()
    renderApp('/', { source: createFakeSource().source })

    await hero()
    expect(await screen.findByRole('heading', { name: /Next \d+ hours/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '3-day forecast' })).toBeInTheDocument()
    expect(await screen.findByTestId('hourly-chart')).toBeInTheDocument()
    expect(await screen.findByTestId('wind-chart')).toBeInTheDocument()

    for (const title of [
      'Wind',
      'Humidity',
      'UV index',
      'Pressure',
      'Sunrise & sunset',
      'Precipitation',
      'Visibility',
      'Cloud cover',
      'Air quality',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
    }
  })

  it('fills the widgets with correctly formatted values and plain-language notes', async () => {
    saveActiveLocation()
    renderApp('/', { source: createFakeSource().source })
    await hero()

    expect(widget('Wind')).toHaveTextContent('14')
    expect(widget('Wind')).toHaveTextContent('km/h')
    expect(widget('Wind')).toHaveTextContent('from the SSW')
    expect(widget('Wind')).toHaveTextContent('Gusts up to 45 km/h')
    expect(widget('Humidity')).toHaveTextContent('82%')
    expect(widget('Humidity')).toHaveTextContent('dew point is 8°C')
    expect(widget('UV index')).toHaveTextContent('0.5')
    expect(widget('UV index')).toHaveTextContent('Low')
    expect(widget('Pressure')).toHaveTextContent('996')
    expect(widget('Visibility')).toHaveTextContent('25 km')
    expect(widget('Visibility')).toHaveTextContent('Excellent')
    expect(widget('Cloud cover')).toHaveTextContent('100%')
    expect(widget('Cloud cover')).toHaveTextContent('Overcast')
    // Sun times are shown in the location's time zone (04:48 UTC is 06:48 in Berlin).
    expect(widget('Sunrise & sunset')).toHaveTextContent('06:48')
    expect(widget('Sunrise & sunset')).toHaveTextContent('17:20')
  })

  it('loads air quality separately and shows it', async () => {
    saveActiveLocation()
    const fake = createFakeSource()
    renderApp('/', { source: fake.source })
    await hero()
    expect(await screen.findByText('Good (US AQI).')).toBeInTheDocument()
    expect(fake.getAirQuality).toHaveBeenCalledOnce()
    expect(widget('Air quality')).toHaveTextContent('29')
    expect(widget('Air quality')).toHaveTextContent('PM2.5')
  })

  it('keeps the rest of the page when air quality fails, and offers a retry inside the widget', async () => {
    saveActiveLocation()
    const getAirQuality = vi
      .fn()
      .mockRejectedValueOnce(new WeatherApiError('network', 'down'))
      .mockResolvedValue((await import('../../test/fakeSource')).fixtureAirQuality())
    renderApp('/', { source: createFakeSource({ getAirQuality }).source })

    await hero()
    expect(await screen.findByText('Air quality is unavailable.')).toBeInTheDocument()
    // The weather itself is untouched.
    expect(screen.getByRole('region', { name: 'Berlin' })).toHaveTextContent('Overcast')

    await userEvent.click(within(widget('Air quality')).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Good (US AQI).')).toBeInTheDocument()
  })

  it('says air quality is not recorded in snapshot-style failures instead of offering a retry', async () => {
    saveActiveLocation()
    const getAirQuality = vi.fn().mockRejectedValue(new WeatherApiError('not-available', 'none'))
    renderApp('/', { source: createFakeSource({ getAirQuality }).source })
    await hero()
    expect(await screen.findByText(/not part of the recorded data/)).toBeInTheDocument()
    expect(within(widget('Air quality')).queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('data states', () => {
  it('shows a skeleton while loading, then the data with a freshness label in the location time zone', async () => {
    saveActiveLocation()
    let resolve!: (report: WeatherReport) => void
    const pending = new Promise<WeatherReport>((r) => (resolve = r))
    renderApp('/', { source: createFakeSource({ getWeather: vi.fn(() => pending) }).source })

    expect(await screen.findByText('Loading weather for Berlin')).toBeInTheDocument()
    await act(async () => resolve(fixtureReport()))

    // (Not toBeVisible: entrance animations start at opacity 0 and jsdom never runs them.)
    expect(
      await screen.findByText(/Observed Sat 24 Oct, 18:00 \(Europe\/Berlin\)/),
    ).toBeInTheDocument()
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
    expect(await hero()).toHaveTextContent('Overcast')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('offers "Choose another place" instead of a useless retry when the source has nothing for a place', async () => {
    saveActiveLocation()
    const getWeather = vi.fn().mockRejectedValue(new WeatherApiError('not-available', 'none'))
    renderApp('/', { source: createFakeSource({ kind: 'snapshot', getWeather }).source })

    expect(await screen.findByRole('alert')).toHaveTextContent('No data for this place')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Choose another place' }))
    expect(await screen.findByRole('heading', { name: 'Choose a location' })).toBeInTheDocument()
  })

  it('keeps old data on screen, marked out of date, when a refresh fails', async () => {
    saveActiveLocation()
    const getWeather = vi
      .fn()
      .mockResolvedValueOnce(fixtureReport())
      .mockRejectedValue(new WeatherApiError('network', 'offline'))
    const queryClient = createTestQueryClient()
    renderApp('/', { source: createFakeSource({ getWeather }).source, queryClient })

    expect(await hero()).toHaveTextContent('Overcast')
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['weather'] })
    })

    expect(await screen.findByText(/Out of date/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Berlin' })).toHaveTextContent('Overcast')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows "not available" for missing values, never a zero', async () => {
    saveActiveLocation()
    const report = fixtureReport()
    report.current = {
      ...report.current,
      temperature: null,
      feelsLike: null,
      humidity: null,
      windSpeed: null,
      windGusts: null,
      windDirection: null,
      pressure: null,
      uvIndex: null,
      visibility: null,
      cloudCover: null,
      precipitation: null,
    }
    renderApp('/', {
      source: createFakeSource({ getWeather: vi.fn().mockResolvedValue(report) }).source,
    })

    const card = await hero()
    expect(within(card).getAllByText('not available').length).toBeGreaterThanOrEqual(1)
    for (const title of ['Wind', 'Humidity', 'UV index', 'Pressure', 'Visibility', 'Cloud cover']) {
      expect(widget(title)).toHaveTextContent(/not available/i)
    }
    // A missing temperature must not appear as 0°.
    expect(card).not.toHaveTextContent(/^0°/)
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
  it('prompts for a location when none is chosen', async () => {
    renderApp('/forecast', { source: createFakeSource().source })
    expect(await screen.findByRole('heading', { name: 'Choose a location' })).toBeInTheDocument()
  })
})
