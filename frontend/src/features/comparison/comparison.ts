import type { WeatherReport } from '../../domain/weather'
import {
  MISSING,
  convertTemperature,
  formatPercent,
  formatPrecipitation,
  formatTemperature,
  formatUv,
  formatWindSpeed,
} from '../../lib/formatting'
import type { UnitPreferences } from '../../lib/formatting'
import { dailyForToday, hoursFromNow } from '../weather/selectors'

export type Mark = 'highest' | 'lowest' | null

export interface CompareCell {
  /** Formatted for display in the user's units; a dash when the value is missing. */
  text: string
  /** Which end of the range this city is, when there is a meaningful comparison. */
  mark: Mark
}

export interface CompareRow {
  id: string
  label: string
  cells: CompareCell[]
}

/**
 * Marks the highest and lowest of the known values. Nothing is marked unless at least two cities
 * have a value and they are not all equal, so a lone or tied value is never called "highest".
 */
export function markExtremes(values: readonly (number | null)[]): Mark[] {
  const known = values.filter((value): value is number => value !== null)
  if (known.length < 2) return values.map(() => null)
  const max = Math.max(...known)
  const min = Math.min(...known)
  if (max === min) return values.map(() => null)
  return values.map((value) => (value === max ? 'highest' : value === min ? 'lowest' : null))
}

interface RowDefinition {
  id: string
  label: string
  /** The comparable value in metric (display conversion is monotonic, so order is unchanged). */
  value: (report: WeatherReport) => number | null
  format: (value: number | null, units: UnitPreferences) => string
}

const day = (report: WeatherReport) => dailyForToday(report)

const DEFINITIONS: readonly RowDefinition[] = [
  {
    id: 'temperature',
    label: 'Temperature now',
    value: (r) => r.current.temperature,
    format: (v, u) => formatTemperature(v, u.temperature),
  },
  {
    id: 'feels-like',
    label: 'Feels like',
    value: (r) => r.current.feelsLike,
    format: (v, u) => formatTemperature(v, u.temperature),
  },
  {
    id: 'high',
    label: 'Today’s high',
    value: (r) => day(r)?.maxTemperature ?? null,
    format: (v, u) => formatTemperature(v, u.temperature),
  },
  {
    id: 'low',
    label: 'Today’s low',
    value: (r) => day(r)?.minTemperature ?? null,
    format: (v, u) => formatTemperature(v, u.temperature),
  },
  {
    id: 'rain-chance',
    label: 'Chance of rain today',
    value: (r) => day(r)?.precipitationProbability ?? null,
    format: (v) => formatPercent(v),
  },
  {
    id: 'precipitation',
    label: 'Precipitation today',
    value: (r) => day(r)?.precipitationSum ?? null,
    format: (v) => formatPrecipitation(v),
  },
  {
    id: 'humidity',
    label: 'Humidity',
    value: (r) => r.current.humidity,
    format: (v) => formatPercent(v),
  },
  {
    id: 'wind',
    label: 'Wind',
    value: (r) => r.current.windSpeed,
    format: (v, u) => formatWindSpeed(v, u.windSpeed),
  },
  {
    id: 'gusts',
    label: 'Gusts',
    value: (r) => r.current.windGusts,
    format: (v, u) => formatWindSpeed(v, u.windSpeed),
  },
  {
    id: 'uv',
    label: 'UV index',
    value: (r) => r.current.uvIndex,
    format: (v) => formatUv(v),
  },
  {
    id: 'cloud',
    label: 'Cloud cover',
    value: (r) => r.current.cloudCover,
    format: (v) => formatPercent(v),
  },
]

/**
 * One row per metric, one cell per city, in the user's units. A city without data (still loading
 * or failed) is `null` and shows a dash in every row without affecting the others.
 */
export function buildCompareRows(
  reports: readonly (WeatherReport | null)[],
  units: UnitPreferences,
): CompareRow[] {
  return DEFINITIONS.map((definition) => {
    const values = reports.map((report) => (report ? definition.value(report) : null))
    const marks = markExtremes(values)
    return {
      id: definition.id,
      label: definition.label,
      cells: values.map((value, index) => ({
        text: value === null ? MISSING : definition.format(value, units),
        mark: marks[index] ?? null,
      })),
    }
  })
}

export interface CompareChartSeries {
  /** Data key in each chart row, e.g. `c0`. */
  key: string
  name: string
}

export interface CompareChartRow {
  /** Hours from now, so cities in different time zones line up on the same instants. */
  offset: number
  label: string
  [key: string]: number | string | null
}

/**
 * Temperature over the next `hours` hours for each city, aligned by real elapsed time (not clock
 * time), so Tokyo and Los Angeles are compared at the same instants. Each row also carries the
 * city's own local time (`<key>-time`) for the tooltip.
 */
export function buildCompareChart(
  cities: readonly { name: string }[],
  reports: readonly (WeatherReport | null)[],
  units: UnitPreferences,
  localTime: (iso: string, timezone: string) => string,
  hours = 24,
): { series: CompareChartSeries[]; rows: CompareChartRow[] } {
  const series = cities.map((city, index) => ({ key: `c${index}`, name: city.name }))
  const perCity = reports.map((report) => (report ? hoursFromNow(report, hours) : []))
  const rows: CompareChartRow[] = []

  for (let offset = 0; offset < hours; offset++) {
    const row: CompareChartRow = { offset, label: offset === 0 ? 'Now' : `+${offset} h` }
    let any = false
    series.forEach(({ key }, index) => {
      const hour = perCity[index]?.[offset]
      const report = reports[index]
      const temperature = hour?.temperature ?? null
      row[key] = temperature === null ? null : convertTemperature(temperature, units.temperature)
      row[`${key}-time`] = hour && report ? localTime(hour.time, report.timezone) : null
      if (temperature !== null) any = true
    })
    if (any) rows.push(row)
  }
  return { series, rows }
}
