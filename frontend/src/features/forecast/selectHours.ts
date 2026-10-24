import type { HourlyForecast } from '../../domain/weather'

const HOUR_MS = 60 * 60 * 1000

/**
 * The next `count` hourly entries starting at the hour containing `from` (an ISO instant),
 * so the list begins "now" rather than at midnight.
 */
export function selectHours(
  hourly: readonly HourlyForecast[],
  from: string,
  count: number,
): HourlyForecast[] {
  const start = Date.parse(from)
  if (Number.isNaN(start)) return hourly.slice(0, count)
  return hourly.filter((hour) => Date.parse(hour.time) > start - HOUR_MS).slice(0, count)
}
