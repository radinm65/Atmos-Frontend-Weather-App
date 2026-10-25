import { skipToken, useQueries, useQuery } from '@tanstack/react-query'
import type { Location } from '../../domain/location'
import { queryKeys } from '../../lib/query/keys'
import { weatherQueryOptions } from './weatherQueryOptions'
import { useWeatherDataSource } from './WeatherDataSourceContext'

/**
 * Current conditions and forecast for a location. Overview, forecast, comparison, saved places
 * and (later) map details and assistant context all read through the same query definition. If a
 * refresh fails after a success, `data` is kept and `isError` is true, so callers can show it as
 * stale.
 */
export function useWeather(location: Location | null) {
  const source = useWeatherDataSource()
  const options = location ? weatherQueryOptions(source, location) : null
  return useQuery({
    queryKey: options?.queryKey ?? queryKeys.weather(source.kind, 'none'),
    queryFn: options?.queryFn ?? skipToken,
    staleTime: options?.staleTime,
  })
}

/** Weather for several places at once, each with its own loading and error state. */
export function useWeatherQueries(locations: readonly Location[]) {
  const source = useWeatherDataSource()
  return useQueries({ queries: locations.map((location) => weatherQueryOptions(source, location)) })
}
