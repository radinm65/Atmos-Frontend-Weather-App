import type { Location } from './location'

/**
 * App-owned weather types. Values are metric (°C, km/h, mm) and missing measurements are
 * `null`, never zero (OPEN_DECISIONS D-10). Instants are ISO-8601 UTC strings; show them in
 * `WeatherReport.timezone`, never silently in the browser's zone (D-11).
 */

/** Matches the photography scene categories in DESIGN_SPEC §9. */
export type ConditionCategory =
  'clear' | 'partly-cloudy' | 'overcast' | 'fog' | 'rain' | 'snow' | 'thunderstorm' | 'unknown'

export interface WeatherCondition {
  category: ConditionCategory
  /** Human-readable text, e.g. "Light rain". The condition is always stated in text. */
  label: string
  /** Provider code (WMO), kept for debugging; `null` when the provider gave none. */
  code: number | null
}

export interface CurrentWeather {
  temperature: number | null
  feelsLike: number | null
  condition: WeatherCondition
  humidity: number | null
  windSpeed: number | null
  precipitation: number | null
  /** `null` when the provider does not say. */
  isDay: boolean | null
  observedAt: string
}

export interface HourlyForecast {
  time: string
  temperature: number | null
  precipitationProbability: number | null
  condition: WeatherCondition | null
  isDay: boolean | null
}

export interface DailyForecast {
  /** Local calendar date at the location, `YYYY-MM-DD`. */
  date: string
  minTemperature: number | null
  maxTemperature: number | null
  condition: WeatherCondition | null
  precipitationProbability: number | null
  precipitationSum: number | null
}

export type DataSourceKind = 'live' | 'snapshot'

export interface DataSourceInfo {
  kind: DataSourceKind
  /** For snapshots: when the data was recorded. Snapshots are never live conditions. */
  capturedAt?: string
}

export interface WeatherReport {
  location: Location
  /** IANA time zone of the location, as reported by the provider. */
  timezone: string
  utcOffsetSeconds: number
  current: CurrentWeather
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  /** When this report was obtained (live) or recorded (snapshot). */
  fetchedAt: string
  source: DataSourceInfo
}
