import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WeatherApiError } from '../../lib/api'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { berlinNewHampshire, createFakeSource } from '../../test/fakeSource'
import { renderApp } from '../../test/render'
import { ACTIVE_LOCATION_KEY, loadActiveLocation } from './activeLocationStorage'
import {
  MAX_SAVED_LOCATIONS,
  SAVED_LOCATIONS_KEY,
  loadSavedLocations,
} from './savedLocationsStorage'

// Recharts needs real element sizes, which jsdom lacks; chart data helpers are tested separately.
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

function store(value: unknown) {
  window.localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(value))
}

describe('loadSavedLocations (stored data)', () => {
  it('is empty when nothing is stored', () => {
    expect(loadSavedLocations()).toEqual([])
  })

  it('keeps good entries and drops corrupted ones without losing the rest', () => {
    store([berlin, { name: 'No id' }, 42, null, { ...tokyo, latitude: 999 }, tokyo])
    expect(loadSavedLocations().map((place) => place.id)).toEqual(['om:2950159', 'om:1850147'])
  })

  it('removes duplicates and enforces the cap', () => {
    store([berlin, berlin])
    expect(loadSavedLocations()).toHaveLength(1)
    store(
      Array.from({ length: MAX_SAVED_LOCATIONS + 5 }, (_, i) => ({
        ...berlin,
        id: `om:${i + 1}`,
      })),
    )
    expect(loadSavedLocations()).toHaveLength(MAX_SAVED_LOCATIONS)
  })

  it('survives non-JSON and non-list data', () => {
    window.localStorage.setItem(SAVED_LOCATIONS_KEY, '{oops')
    expect(loadSavedLocations()).toEqual([])
    store({ id: 'om:1' })
    expect(loadSavedLocations()).toEqual([])
  })
})

describe('Locations page', () => {
  it('explains how to add a place when none are saved', async () => {
    renderApp('/locations', { source: createFakeSource().source })
    expect(await screen.findByRole('heading', { level: 1, name: 'Locations' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No saved locations yet' })).toBeInTheDocument()
    expect(screen.getByText(/kept in this browser only/)).toBeInTheDocument()
  })

  it('does not crash on corrupted stored data and still shows the good entries', async () => {
    store([{ junk: true }, tokyo, 'nope'])
    renderApp('/locations', { source: createFakeSource().source })
    expect(await screen.findByRole('article', { name: 'Tokyo' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('saves a place found by search, shows its live weather, and persists it', async () => {
    const fake = createFakeSource()
    renderApp('/locations', { source: fake.source })

    await userEvent.type(await screen.findByRole('combobox'), 'berlin')
    await userEvent.click((await screen.findAllByRole('option'))[0]!)

    const card = await screen.findByRole('article', { name: 'Berlin' })
    expect(await within(card).findByText('Overcast')).toBeInTheDocument()
    expect(within(card).getByText(/9°/)).toBeInTheDocument()
    expect(loadSavedLocations().map((place) => place.id)).toEqual(['om:2950159'])
  })

  it('lets you remove a saved place', async () => {
    store([berlin, tokyo])
    renderApp('/locations', { source: createFakeSource().source })
    await screen.findByRole('article', { name: 'Berlin' })

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Berlin from saved locations' }),
    )
    expect(screen.queryByRole('article', { name: 'Berlin' })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Tokyo' })).toBeInTheDocument()
    expect(loadSavedLocations().map((place) => place.name)).toEqual(['Tokyo'])
  })

  it('makes a saved place the active one and opens its weather', async () => {
    store([berlin, tokyo])
    renderApp('/locations', { source: createFakeSource().source })
    const card = await screen.findByRole('article', { name: 'Tokyo' })

    await userEvent.click(within(card).getByRole('button', { name: /View weather/ }))

    expect(await screen.findByRole('region', { name: 'Tokyo' })).toBeInTheDocument()
    expect(loadActiveLocation()?.name).toBe('Tokyo')
  })

  it('keeps one failing city inside its own card', async () => {
    store([berlin, tokyo])
    const getWeather = vi.fn((location: { id: string }) =>
      location.id === tokyo.id
        ? Promise.reject(new WeatherApiError('network', 'down'))
        : Promise.resolve(createFakeSource().source.getWeather(berlin)),
    )
    renderApp('/locations', {
      source: createFakeSource({ getWeather: getWeather as never }).source,
    })

    const tokyoCard = await screen.findByRole('article', { name: 'Tokyo' })
    expect(await within(tokyoCard).findByRole('alert')).toHaveTextContent(/internet connection/i)
    const berlinCard = screen.getByRole('article', { name: 'Berlin' })
    expect(await within(berlinCard).findByText('Overcast')).toBeInTheDocument()
  })

  it('stops accepting new places when the list is full', async () => {
    store(
      Array.from({ length: MAX_SAVED_LOCATIONS }, (_, i) => ({
        ...berlin,
        id: `om:${i + 1}`,
        name: `City ${i + 1}`,
      })),
    )
    renderApp('/locations', { source: createFakeSource().source })
    expect(await screen.findByText(/Your saved list is full/)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})

describe('Save button on the Overview', () => {
  it('saves and removes the shown place, reflecting the state for assistive tech', async () => {
    window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
    renderApp('/', { source: createFakeSource().source })
    const button = await screen.findByRole('button', { name: /^Save Berlin/ })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(button)
    expect(screen.getByRole('button', { name: /^Saved/ })).toHaveAttribute('aria-pressed', 'true')
    expect(loadSavedLocations().map((place) => place.id)).toEqual(['om:2950159'])

    await userEvent.click(screen.getByRole('button', { name: /^Saved/ }))
    expect(screen.getByRole('button', { name: /^Save Berlin/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(loadSavedLocations()).toEqual([])
  })
})

describe('quick switching in the location menu', () => {
  it('lists saved places and switches to one with a single click', async () => {
    store([tokyo, berlinNewHampshire])
    window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
    renderApp('/', { source: createFakeSource().source })
    await screen.findByRole('region', { name: 'Berlin' })

    await userEvent.click(screen.getByRole('button', { name: /^Berlin/ }))
    const panel = screen.getByRole('group', { name: 'Choose a location' })
    const list = within(panel).getByRole('list')
    expect(
      within(list)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual([
      // A region that just repeats the city name ("Tokyo, Tokyo") is not shown twice.
      'TokyoJapan',
      'BerlinNew Hampshire, United States',
    ])

    await userEvent.click(within(list).getByRole('button', { name: /Tokyo/ }))
    expect(await screen.findByRole('region', { name: 'Tokyo' })).toBeInTheDocument()
    expect(loadActiveLocation()?.name).toBe('Tokyo')
    expect(screen.queryByRole('group', { name: 'Choose a location' })).not.toBeInTheDocument()
  })

  it('shows no saved section when nothing is saved', async () => {
    renderApp('/', { source: createFakeSource().source })
    await userEvent.click(await screen.findByRole('button', { name: /choose location/i }))
    const panel = screen.getByRole('group', { name: 'Choose a location' })
    expect(within(panel).queryByRole('heading', { name: 'Saved' })).not.toBeInTheDocument()
  })
})
