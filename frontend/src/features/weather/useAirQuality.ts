import { useQuery } from '@tanstack/react-query'
import type { Location } from '../../domain/location'
import { queryKeys } from '../../lib/query/keys'
import { WEATHER_STALE_TIME_MS } from '../../lib/query/queryClient'
import { useWeatherDataSource } from './WeatherDataSourceContext'

/**
 * Air quality for a location. It is secondary widget data with its own request, so a failure
 * shows inside that widget only and never blanks the weather page.
 */
export function useAirQuality(location: Location | null) {
  const source = useWeatherDataSource()
  return useQuery({
    queryKey: queryKeys.airQuality(source.kind, location?.id ?? 'none'),
    queryFn: ({ signal }) => {
      if (!location) throw new Error('useAirQuality: query ran without a location')
      return source.getAirQuality(location, { signal })
    },
    enabled: location !== null,
    staleTime: WEATHER_STALE_TIME_MS,
  })
}
