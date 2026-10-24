import type { DataSourceKind } from '../../domain/weather'

/**
 * All query keys live here. The data-source kind is part of every key so live and snapshot
 * data never share a cache entry.
 */
export const queryKeys = {
  locationSearch: (source: DataSourceKind, query: string) =>
    ['location-search', source, query.trim().toLowerCase()] as const,
  weather: (source: DataSourceKind, locationId: string) => ['weather', source, locationId] as const,
}
