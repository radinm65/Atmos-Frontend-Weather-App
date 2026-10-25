import type { DailyForecast, HourlyForecast, WeatherReport } from '../../domain/weather'
import { toLocalDate } from '../../lib/formatting'
import { selectHours } from '../forecast/selectHours'

/** The daily entry for the local calendar day of the current observation, if the report has it. */
export function dailyForToday(report: WeatherReport): DailyForecast | null {
  const today = toLocalDate(report.current.observedAt, report.timezone)
  return report.daily.find((day) => day.date === today) ?? report.daily[0] ?? null
}

/** The next `count` hourly entries, starting with the hour of the current observation. */
export function hoursFromNow(report: WeatherReport, count: number): HourlyForecast[] {
  return selectHours(report.hourly, report.current.observedAt, count)
}

/** Lowest and highest temperature across all returned days, or `null` if none are known. */
export function temperatureExtent(daily: readonly DailyForecast[]): [number, number] | null {
  const values = daily
    .flatMap((day) => [day.minTemperature, day.maxTemperature])
    .filter((value): value is number => value !== null)
  if (values.length === 0) return null
  return [Math.min(...values), Math.max(...values)]
}

/**
 * How far through the daylight the observation is: 0 at sunrise, 1 at sunset, `null` at night or
 * when sun times are unknown.
 */
export function daylightProgress(
  observedAt: string,
  sunrise: string | null,
  sunset: string | null,
): number | null {
  if (!sunrise || !sunset) return null
  const now = Date.parse(observedAt)
  const rise = Date.parse(sunrise)
  const set = Date.parse(sunset)
  if ([now, rise, set].some(Number.isNaN) || set <= rise) return null
  if (now < rise || now > set) return null
  return (now - rise) / (set - rise)
}
