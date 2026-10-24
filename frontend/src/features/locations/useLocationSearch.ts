import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query/keys'
import { SEARCH_STALE_TIME_MS } from '../../lib/query/queryClient'
import { useWeatherDataSource } from '../weather/WeatherDataSourceContext'

/** Providers return nothing useful for very short input. */
export const MIN_SEARCH_LENGTH = 2

/**
 * Searches places by name. Superseded requests are cancelled through the query's AbortSignal,
 * so a slow earlier response can never overwrite a newer one.
 */
export function useLocationSearch(query: string) {
  const source = useWeatherDataSource()
  const trimmed = query.trim()
  return useQuery({
    queryKey: queryKeys.locationSearch(source.kind, trimmed),
    queryFn: ({ signal }) => source.searchLocations(trimmed, { signal }),
    enabled: trimmed.length >= MIN_SEARCH_LENGTH,
    staleTime: SEARCH_STALE_TIME_MS,
  })
}
