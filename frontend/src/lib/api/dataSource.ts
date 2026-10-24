import type { Location } from '../../domain/location'
import type { DataSourceKind, WeatherReport } from '../../domain/weather'

export interface RequestContext {
  signal?: AbortSignal
}

/**
 * The only way the app obtains weather data. The live Open-Meteo source and the recorded
 * snapshot source both implement it, so switching is configuration, not a code change
 * (OPEN_DECISIONS D-18, TRD §4a). Everything above this interface is identical in both modes.
 */
export interface WeatherDataSource {
  readonly kind: DataSourceKind

  /** Places matching `query`. An empty array means "nothing found", not an error. */
  searchLocations(query: string, context?: RequestContext): Promise<Location[]>

  /** Current conditions and forecasts for a place. */
  getWeather(location: Location, context?: RequestContext): Promise<WeatherReport>
}
