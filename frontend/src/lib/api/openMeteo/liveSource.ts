import type { Location } from '../../../domain/location'
import type { WeatherDataSource } from '../dataSource'
import { fetchAirQuality, fetchForecast, fetchGeocoding } from './client'
import type { RequestOptions } from './client'
import { normalizeAirQuality, normalizeForecast, normalizeGeocoding } from './normalize'

const SEARCH_RESULT_COUNT = 8

/** Live Open-Meteo data. `fetchImpl` is injectable for tests. */
export function createLiveSource(fetchImpl?: typeof fetch): WeatherDataSource {
  const options = (signal: AbortSignal | undefined): RequestOptions => ({ signal, fetchImpl })

  return {
    kind: 'live',

    async searchLocations(query, context) {
      const response = await fetchGeocoding(query, SEARCH_RESULT_COUNT, options(context?.signal))
      return normalizeGeocoding(response)
    },

    async getWeather(location: Location, context) {
      const response = await fetchForecast(location, options(context?.signal))
      return normalizeForecast(response, location, { kind: 'live' }, new Date().toISOString())
    },

    async getAirQuality(location: Location, context) {
      const response = await fetchAirQuality(location, options(context?.signal))
      return normalizeAirQuality(response, { kind: 'live' }, new Date().toISOString())
    },
  }
}
