import { convertTemperature, convertWindSpeed } from './units'
import type { TemperatureUnit, WindSpeedUnit } from './units'

/** Shown for any missing value. Never substitute zero for a missing measurement. */
export const MISSING = '—'

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function formatTemperature(
  celsius: number | null | undefined,
  unit: TemperatureUnit,
  options: { withUnit?: boolean } = {},
): string {
  if (!isNumber(celsius)) return MISSING
  // Avoid "-0°" after rounding.
  const rounded = Math.round(convertTemperature(celsius, unit)) || 0
  return options.withUnit === false ? `${rounded}°` : `${rounded}°${unit === 'f' ? 'F' : 'C'}`
}

export function formatWindSpeed(kmh: number | null | undefined, unit: WindSpeedUnit): string {
  if (!isNumber(kmh)) return MISSING
  return `${Math.round(convertWindSpeed(kmh, unit))} ${unit === 'mph' ? 'mph' : 'km/h'}`
}

export function formatPercent(value: number | null | undefined): string {
  return isNumber(value) ? `${Math.round(value)}%` : MISSING
}

export function formatPrecipitation(mm: number | null | undefined): string {
  if (!isNumber(mm)) return MISSING
  return `${Number(mm.toFixed(1))} mm`
}

function toDate(iso: string): Date | null {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Time of day in the given IANA zone, e.g. "17:00". */
export function formatTime(iso: string, timeZone: string): string {
  const date = toDate(iso)
  if (!date) return MISSING
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** Weekday, date and time in the given zone, e.g. "Sat 24 Oct, 17:00". */
export function formatDateTime(iso: string, timeZone: string): string {
  const date = toDate(iso)
  if (!date) return MISSING
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** Local calendar date (`YYYY-MM-DD`) of an instant in the given zone. */
export function toLocalDate(iso: string, timeZone: string): string | null {
  const date = toDate(iso)
  if (!date) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** "Sat 24 Oct" for a `YYYY-MM-DD` local date. Zone-independent, so no day shifts. */
export function formatLocalDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return MISSING
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parsed)
}

/** Coarse relative age such as "just now", "5 min ago", "2 h ago", "3 days ago". */
export function formatAge(iso: string, now: number = Date.now()): string {
  const date = toDate(iso)
  if (!date) return MISSING
  const minutes = Math.max(0, Math.round((now - date.getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}
