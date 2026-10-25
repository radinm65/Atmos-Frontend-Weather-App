import { clamp } from '../../lib/math'

/** Plain-language descriptions of measurements. Pure functions, no formatting of units. */

const COMPASS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
] as const

/** 16-point compass name for a bearing in degrees (wind direction is where it blows FROM). */
export function compassDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360
  return COMPASS[Math.round(normalized / 22.5) % 16] ?? 'N'
}

export interface Level {
  label: string
  /** 0–1 position on a scale, for gauges. */
  fraction: number
}

/** WHO UV index bands. */
export function describeUv(uv: number): Level & { advice: string } {
  const fraction = clamp(uv / 11)
  if (uv < 3) return { label: 'Low', fraction, advice: 'No protection needed for most people.' }
  if (uv < 6) return { label: 'Moderate', fraction, advice: 'Wear sunscreen and sunglasses.' }
  if (uv < 8) return { label: 'High', fraction, advice: 'Cover up and seek shade at midday.' }
  if (uv < 11)
    return { label: 'Very high', fraction, advice: 'Extra protection needed; avoid midday sun.' }
  return { label: 'Extreme', fraction, advice: 'Stay out of the sun if you can.' }
}

/** Visibility in metres → how far you can see, in plain words. */
export function describeVisibility(metres: number): Level {
  const fraction = clamp(metres / 20000)
  if (metres < 1000) return { label: 'Very poor', fraction }
  if (metres < 4000) return { label: 'Poor', fraction }
  if (metres < 10000) return { label: 'Moderate', fraction }
  if (metres < 20000) return { label: 'Good', fraction }
  return { label: 'Excellent', fraction }
}

/** Relative humidity comfort band. */
export function describeHumidity(percent: number): string {
  if (percent < 30) return 'Dry'
  if (percent < 60) return 'Comfortable'
  if (percent < 80) return 'Humid'
  return 'Very humid'
}

/** Beaufort-style wind description from km/h. */
export function describeWind(kmh: number): string {
  if (kmh < 2) return 'Calm'
  if (kmh < 12) return 'Light breeze'
  if (kmh < 29) return 'Moderate breeze'
  if (kmh < 50) return 'Strong breeze'
  if (kmh < 75) return 'Gale'
  return 'Storm'
}

export type PressureTrend = 'rising' | 'falling' | 'steady'

/** Compares pressure now with three hours ahead. A change of under 1 hPa counts as steady. */
export function pressureTrend(now: number | null, later: number | null): PressureTrend | null {
  if (now === null || later === null) return null
  const change = later - now
  if (Math.abs(change) < 1) return 'steady'
  return change > 0 ? 'rising' : 'falling'
}

/** Human description of how a pressure compares with the 1013 hPa average at sea level. */
export function describePressure(hPa: number): string {
  if (hPa < 1000) return 'Low'
  if (hPa < 1020) return 'Normal'
  return 'High'
}

/** Comparison of "feels like" against the real temperature. */
export function describeFeelsLike(actual: number, feels: number): string {
  const difference = feels - actual
  if (Math.abs(difference) < 1.5) return 'Feels about the same as the air temperature.'
  return difference < 0
    ? 'Feels colder than the air temperature, mostly because of wind or humidity.'
    : 'Feels warmer than the air temperature, mostly because of humidity.'
}
