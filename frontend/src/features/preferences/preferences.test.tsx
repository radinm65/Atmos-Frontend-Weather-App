import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { createFakeSource } from '../../test/fakeSource'
import { renderApp } from '../../test/render'
import { ACTIVE_LOCATION_KEY } from '../locations/activeLocationStorage'
import { PREFERENCES_KEY, loadUnits, saveUnits } from './preferencesStorage'

// Recharts needs real element sizes, which jsdom lacks; chart data helpers are tested separately.
vi.mock('../overview/HourlyChart', () => ({ default: () => <div /> }))
vi.mock('../overview/WindChart', () => ({ default: () => <div /> }))

const metric = { temperature: 'c', windSpeed: 'kmh' }

describe('loadUnits (stored preferences)', () => {
  it('defaults to metric when nothing is stored', () => {
    expect(loadUnits()).toEqual(metric)
  })

  it('round-trips a saved choice', () => {
    saveUnits({ temperature: 'f', windSpeed: 'mph' })
    expect(loadUnits()).toEqual({ temperature: 'f', windSpeed: 'mph' })
  })

  it('ignores data that is not JSON or has the wrong shape', () => {
    window.localStorage.setItem(PREFERENCES_KEY, '{oops')
    expect(loadUnits()).toEqual(metric)
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify('metric'))
    expect(loadUnits()).toEqual(metric)
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ units: 5 }))
    expect(loadUnits()).toEqual(metric)
  })

  it('falls back per field, so one bad value does not reset the other', () => {
    window.localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ units: { temperature: 'kelvin', windSpeed: 'mph' } }),
    )
    expect(loadUnits()).toEqual({ temperature: 'c', windSpeed: 'mph' })
  })
})

function saveLocation() {
  window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
}

const hero = () => screen.findByRole('region', { name: 'Berlin' })

describe('units across the app', () => {
  it('shows metric by default', async () => {
    saveLocation()
    renderApp('/', { source: createFakeSource().source })
    const card = await hero()
    expect(card).toHaveTextContent('9°')
    expect(card).toHaveTextContent('C')
  })

  it('applies saved imperial units on first render', async () => {
    saveLocation()
    saveUnits({ temperature: 'f', windSpeed: 'mph' })
    renderApp('/', { source: createFakeSource().source })
    const card = await hero()
    // 9.4 °C is 48.9 °F; feels-like 6.5 °C is 43.7 °F; high 12 °C is 53.6 °F.
    expect(card).toHaveTextContent('49°')
    expect(card).toHaveTextContent('H 54°')
    expect(card).toHaveTextContent('Feels like 44°')
  })

  it('opens a units panel outside the header, and switching units updates the dashboard and persists', async () => {
    saveLocation()
    renderApp('/', { source: createFakeSource().source })
    await hero()

    const trigger = screen.getByRole('button', { name: /^Units: °C and km\/h/ })
    await userEvent.click(trigger)
    const panel = screen.getByRole('group', { name: 'Units' })
    expect(panel.closest('header')).toBeNull() // portal on <body>, not inside the header
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(within(panel).getByRole('radio', { name: '°F' }))
    await userEvent.click(within(panel).getByRole('radio', { name: 'mph' }))

    // Every temperature and wind display changes together.
    const card = screen.getByRole('region', { name: 'Berlin' })
    expect(card).toHaveTextContent('49°')
    const wind = screen.getByRole('heading', { level: 3, name: 'Wind' }).closest('article')
    expect(wind).toHaveTextContent('mph')
    expect(wind).not.toHaveTextContent('km/h')
    expect(screen.getByRole('button', { name: /^Units: °F and mph/ })).toBeInTheDocument()

    expect(loadUnits()).toEqual({ temperature: 'f', windSpeed: 'mph' })
  })

  it('closes the panel with Escape and returns focus to the button', async () => {
    saveLocation()
    renderApp('/', { source: createFakeSource().source })
    await hero()
    const trigger = screen.getByRole('button', { name: /^Units:/ })
    await userEvent.click(trigger)
    expect(screen.getByRole('group', { name: 'Units' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('group', { name: 'Units' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
