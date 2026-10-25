import type { HourlyForecast } from '../../domain/weather'
import { convertTemperature, convertWindSpeed, formatTime } from '../../lib/formatting'
import type { TemperatureUnit, WindSpeedUnit } from '../../lib/formatting'

export interface ChartRow {
  /** ISO instant, for tooltips and keys. */
  time: string
  /** Hour label in the location's time zone, e.g. "15:00". */
  label: string
  temperature: number | null
  feelsLike: number | null
  rainChance: number | null
  precipitation: number | null
  windSpeed: number | null
  windGusts: number | null
  uvIndex: number | null
}

/** Rows for the charts: temperatures converted for display, everything else as provided. */
export function toChartRows(
  hours: readonly HourlyForecast[],
  timezone: string,
  unit: TemperatureUnit,
  windUnit: WindSpeedUnit = 'kmh',
): ChartRow[] {
  const temp = (value: number | null) => (value === null ? null : convertTemperature(value, unit))
  const wind = (value: number | null) => (value === null ? null : convertWindSpeed(value, windUnit))
  return hours.map((hour) => ({
    time: hour.time,
    label: formatTime(hour.time, timezone),
    temperature: temp(hour.temperature),
    feelsLike: temp(hour.feelsLike),
    rainChance: hour.precipitationProbability,
    precipitation: hour.precipitation,
    windSpeed: wind(hour.windSpeed),
    windGusts: wind(hour.windGusts),
    uvIndex: hour.uvIndex,
  }))
}

/** A text equivalent of the wind chart. */
export function summarizeWindRows(rows: readonly ChartRow[], unitLabel: string): string {
  const speeds = rows.filter(
    (row): row is ChartRow & { windSpeed: number } => row.windSpeed !== null,
  )
  if (speeds.length === 0) return 'Wind data is not available for this period.'
  const peak = speeds.reduce((a, b) => (b.windSpeed > a.windSpeed ? b : a))
  const gust = rows.reduce((max, row) => Math.max(max, row.windGusts ?? 0), 0)
  return (
    `Wind peaks at ${Math.round(peak.windSpeed)} ${unitLabel} at ${peak.label}.` +
    (gust > 0 ? ` Gusts reach ${Math.round(gust)} ${unitLabel}.` : '')
  )
}

/** A text equivalent of the temperature chart, for screen readers and as a visible caption. */
export function summarizeTemperatureRows(rows: readonly ChartRow[], unitSymbol: string): string {
  const known = rows.filter(
    (row): row is ChartRow & { temperature: number } => row.temperature !== null,
  )
  if (known.length === 0) return 'Temperature data is not available for this period.'
  const high = known.reduce((a, b) => (b.temperature > a.temperature ? b : a))
  const low = known.reduce((a, b) => (b.temperature < a.temperature ? b : a))
  const rain = rows.reduce((max, row) => Math.max(max, row.rainChance ?? 0), 0)
  const fmt = (n: number) => `${Math.round(n)}${unitSymbol}`
  return (
    `Highest ${fmt(high.temperature)} at ${high.label}, lowest ${fmt(low.temperature)} at ${low.label}.` +
    (rain > 0 ? ` Chance of rain peaks at ${Math.round(rain)}%.` : ' No rain expected.')
  )
}
