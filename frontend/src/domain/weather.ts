import type { Location } from './location'

/**
 * App-owned weather types. Values are metric (°C, km/h, mm, hPa, m) and missing measurements are
 * `null`, never zero (OPEN_DECISIONS D-10). Instants are ISO-8601 UTC strings; show them in
 * `WeatherReport.timezone`, never silently in the browser's zone (D-11).
 */

/** Categories the backdrop videos and weather icons are chosen by. */
export type ConditionCategory =
  'clear' | 'partly-cloudy' | 'overcast' | 'fog' | 'rain' | 'snow' | 'thunderstorm' | 'unknown'

export interface WeatherCondition {
  category: ConditionCategory
  /** Human-readable text, e.g. "Light rain". The condition is always stated in text. */
  label: string
  /** Provider code (WMO), kept for icons and debugging; `null` when the provider gave none. */
  code: number | null
}

export interface CurrentWeather {
  temperature: number | null
  feelsLike: number | null
  condition: WeatherCondition
  humidity: number | null
  /** km/h */
  windSpeed: number | null
  /** Gusts in km/h. */
  windGusts: number | null
  /** Direction the wind blows FROM, degrees clockwise from north. */
  windDirection: number | null
  precipitation: number | null
  /** Sea-level pressure, hPa. */
  pressure: number | null
  /** UV index (0–11+). */
  uvIndex: number | null
  /** Horizontal visibility in metres. */
  visibility: number | null
  /** Dew point, °C. */
  dewPoint: number | null
  /** Sky cover, 0–100 %. */
  cloudCover: number | null
  /** `null` when the provider does not say. */
  isDay: boolean | null
  observedAt: string
}

export interface HourlyForecast {
  time: string
  temperature: number | null
  feelsLike: number | null
  humidity: number | null
  precipitationProbability: number | null
  /** Precipitation in mm over the hour. */
  precipitation: number | null
  condition: WeatherCondition | null
  cloudCover: number | null
  windSpeed: number | null
  windGusts: number | null
  pressure: number | null
  uvIndex: number | null
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
  /** Hours with measurable precipitation. */
  precipitationHours: number | null
  uvIndexMax: number | null
  windSpeedMax: number | null
  windGustsMax: number | null
  /** Sun times as UTC instants; `null` when missing (e.g. polar day or night). */
  sunrise: string | null
  sunset: string | null
  daylightSeconds: number | null
  sunshineSeconds: number | null
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
