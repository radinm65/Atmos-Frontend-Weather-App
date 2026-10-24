import { vi } from 'vitest'
import type { Location } from '../domain/location'
import type { WeatherReport } from '../domain/weather'
import type { WeatherDataSource } from '../lib/api'
import { normalizeForecast } from '../lib/api/openMeteo/normalize'
import { forecastResponseSchema } from '../lib/api/openMeteo/schemas'
import { berlin, forecastFixture } from '../lib/api/openMeteo/testFixtures'

/** TEST-ONLY. Fixture-backed data source with spies; never used by the running app. */

export const berlinNewHampshire: Location = {
  id: 'om:5083330',
  name: 'Berlin',
  region: 'New Hampshire',
  country: 'United States',
  latitude: 44.46867,
  longitude: -71.18508,
}

export function fixtureReport(location: Location = berlin): WeatherReport {
  return normalizeForecast(
    forecastResponseSchema.parse(forecastFixture()),
    location,
    { kind: 'live' },
    new Date().toISOString(),
  )
}

export function createFakeSource(overrides: Partial<WeatherDataSource> = {}) {
  const searchLocations = vi.fn<WeatherDataSource['searchLocations']>((query) =>
    Promise.resolve(query.toLowerCase().includes('berlin') ? [berlin, berlinNewHampshire] : []),
  )
  const getWeather = vi.fn<WeatherDataSource['getWeather']>((location) =>
    Promise.resolve(fixtureReport(location)),
  )
  const source: WeatherDataSource = { kind: 'live', searchLocations, getWeather, ...overrides }
  return { source, searchLocations, getWeather }
}
