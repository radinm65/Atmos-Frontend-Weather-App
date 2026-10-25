import { queryOptions } from '@tanstack/react-query'
import type { Location } from '../../domain/location'
import type { WeatherDataSource } from '../../lib/api'
import { queryKeys } from '../../lib/query/keys'
import { WEATHER_STALE_TIME_MS } from '../../lib/query/queryClient'

/**
 * The one definition of "fetch weather for a place". The Overview, Forecast, Locations and
 * Compare pages all use it, so they share a cache entry per place and there is no second API
 * path (PRD functional requirements, TRD §4).
 */
export function weatherQueryOptions(source: WeatherDataSource, location: Location) {
  return queryOptions({
    queryKey: queryKeys.weather(source.kind, location.id),
    queryFn: ({ signal }) => source.getWeather(location, { signal }),
    staleTime: WEATHER_STALE_TIME_MS,
  })
}
