import type { WeatherReport } from '../../domain/weather'
import { formatPercent } from '../../lib/formatting'
import { dailyForToday } from '../weather/selectors'

/** One honest sentence about the day, built only from values the report actually has. */
export function summarizeDay(report: WeatherReport, formatT: (c: number | null) => string): string {
  const day = dailyForToday(report)
  if (!day) return ''
  const parts: string[] = []
  if (day.maxTemperature !== null || day.minTemperature !== null) {
    parts.push(`Today: high ${formatT(day.maxTemperature)}, low ${formatT(day.minTemperature)}.`)
  }
  const chance = day.precipitationProbability
  if (chance !== null) {
    parts.push(
      chance >= 40
        ? `Precipitation is likely (${formatPercent(chance)} chance).`
        : 'Little chance of precipitation.',
    )
  }
  return parts.join(' ')
}
