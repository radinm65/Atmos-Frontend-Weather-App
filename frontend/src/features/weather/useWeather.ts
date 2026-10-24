import { useQuery } from '@tanstack/react-query'
import type { Location } from '../../domain/location'
import { queryKeys } from '../../lib/query/keys'
import { WEATHER_STALE_TIME_MS } from '../../lib/query/queryClient'
import { useWeatherDataSource } from './WeatherDataSourceContext'

/**
 * Current conditions and forecast for a location. Overview, forecast, and (later) comparison,
 * map details and assistant context all read through this one query. If a refresh fails after a
 * success, `data` is kept and `isError` is true, so callers can show it as stale.
 */
export function useWeather(location: Location | null) {
  const source = useWeatherDataSource()
  return useQuery({
    queryKey: queryKeys.weather(source.kind, location?.id ?? 'none'),
    queryFn: ({ signal }) => {
      if (!location) throw new Error('useWeather: query ran without a location')
      return source.getWeather(location, { signal })
    },
    enabled: location !== null,
    staleTime: WEATHER_STALE_TIME_MS,
  })
}
