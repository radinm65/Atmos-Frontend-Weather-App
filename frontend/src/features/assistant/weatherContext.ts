import type { WeatherReport } from '../../domain/weather'
import {
  formatDateTime,
  formatDistance,
  formatLocalDate,
  formatPercent,
  formatPrecipitation,
  formatPressure,
  formatTemperature,
  formatTime,
  formatUv,
  formatWindSpeed,
  MISSING,
} from '../../lib/formatting'
import type { UnitPreferences } from '../../lib/formatting'
import { ASSISTANT_LIMITS } from '../../lib/assistant/contract'
import { compassDirection } from '../weather/describe'
import { dailyForToday, hoursFromNow } from '../weather/selectors'

/**
 * Turns the forecast the page already shows into the plain text the assistant answers from. Only
 * what is relevant is sent: the place, now, the next day in 3-hour steps, and the days ahead.
 * Missing values are written as "not available", never left out or replaced by zero, so the
 * assistant cannot mistake a gap for a measurement. Values use the person's units.
 */

const HOURLY_STEP = 3
const HOURLY_COUNT = 24
const DAY_COUNT = 7

export interface AssistantContext {
  placeName: string
  text: string
}

export function buildAssistantContext(
  report: WeatherReport,
  units: UnitPreferences,
): AssistantContext {
  const zone = report.timezone
  const temp = (value: number | null | undefined) =>
    orMissing(formatTemperature(value, units.temperature))
  const wind = (value: number | null | undefined) =>
    orMissing(formatWindSpeed(value, units.windSpeed))
  const pct = (value: number | null | undefined) => orMissing(formatPercent(value))
  const mm = (value: number | null | undefined) => orMissing(formatPrecipitation(value))
  const { current } = report
  const today = dailyForToday(report)

  const lines: string[] = []
  lines.push(`Place: ${report.location.name}${detail(report)}`)
  lines.push(`Time zone: ${zone}. All times below are local times in ${zone}.`)
  lines.push(
    report.source.kind === 'snapshot'
      ? `Data: RECORDED SNAPSHOT, captured ${report.source.capturedAt ?? 'on an unknown date'}. It is not live.`
      : `Data: live forecast, retrieved ${formatDateTime(report.fetchedAt, zone)}.`,
  )
  lines.push(
    `Temperatures are in °${units.temperature === 'f' ? 'F' : 'C'}, wind in ${units.windSpeed === 'mph' ? 'mph' : 'km/h'}.`,
  )

  lines.push('', `NOW (${formatTime(current.observedAt, zone)}):`)
  lines.push(`Condition: ${current.condition.label}`)
  lines.push(`Temperature: ${temp(current.temperature)} (feels like ${temp(current.feelsLike)})`)
  lines.push(
    `Wind: ${wind(current.windSpeed)}${current.windDirection === null ? '' : ` from the ${compassDirection(current.windDirection)}`}, gusts ${wind(current.windGusts)}`,
  )
  lines.push(`Humidity: ${pct(current.humidity)}. Cloud cover: ${pct(current.cloudCover)}.`)
  lines.push(`Precipitation in the last hour: ${mm(current.precipitation)}`)
  lines.push(
    `UV index: ${orMissing(formatUv(current.uvIndex))}. Pressure: ${orMissing(formatPressure(current.pressure))}. Visibility: ${orMissing(formatDistance(current.visibility))}.`,
  )

  if (today) {
    lines.push('', 'TODAY:')
    lines.push(
      `High ${temp(today.maxTemperature)}, low ${temp(today.minTemperature)}. Chance of rain ${pct(today.precipitationProbability)}, total precipitation ${mm(today.precipitationSum)}.`,
    )
    lines.push(
      `Strongest wind ${wind(today.windSpeedMax)}, gusts up to ${wind(today.windGustsMax)}. Maximum UV ${orMissing(formatUv(today.uvIndexMax))}.`,
    )
    if (today.sunrise && today.sunset) {
      lines.push(
        `Sunrise ${formatTime(today.sunrise, zone)}, sunset ${formatTime(today.sunset, zone)}.`,
      )
    }
  }

  const hours = hoursFromNow(report, HOURLY_COUNT).filter((_, index) => index % HOURLY_STEP === 0)
  if (hours.length > 0) {
    lines.push('', `NEXT ${HOURLY_COUNT} HOURS (every ${HOURLY_STEP} hours):`)
    for (const hour of hours) {
      lines.push(
        `${formatTime(hour.time, zone)}: ${hour.condition?.label ?? 'condition not available'}, ${temp(hour.temperature)}, chance of rain ${pct(hour.precipitationProbability)}, precipitation ${mm(hour.precipitation)}, wind ${wind(hour.windSpeed)}`,
      )
    }
  }

  const days = report.daily.slice(0, DAY_COUNT)
  if (days.length > 0) {
    lines.push('', `NEXT ${days.length} DAYS:`)
    for (const day of days) {
      lines.push(
        `${formatLocalDate(day.date)}: ${day.condition?.label ?? 'condition not available'}, high ${temp(day.maxTemperature)}, low ${temp(day.minTemperature)}, chance of rain ${pct(day.precipitationProbability)}, precipitation ${mm(day.precipitationSum)}, strongest wind ${wind(day.windSpeedMax)}`,
      )
    }
  }

  return {
    placeName: report.location.name.slice(0, ASSISTANT_LIMITS.placeNameChars),
    text: lines.join('\n').slice(0, ASSISTANT_LIMITS.contextChars),
  }
}

function orMissing(text: string): string {
  return text === MISSING ? 'not available' : text
}

function detail(report: WeatherReport): string {
  const parts = [report.location.region, report.location.country].filter(
    (part): part is string => Boolean(part) && part !== report.location.name,
  )
  return parts.length > 0 ? `, ${parts.join(', ')}` : ''
}
