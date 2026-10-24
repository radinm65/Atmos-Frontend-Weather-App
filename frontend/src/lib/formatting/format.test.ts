import { describe, expect, it } from 'vitest'
import {
  MISSING,
  convertTemperature,
  convertWindSpeed,
  formatAge,
  formatDateTime,
  formatLocalDate,
  formatPercent,
  formatPrecipitation,
  formatTemperature,
  formatTime,
  formatWindSpeed,
  toLocalDate,
} from './index'

describe('unit conversion', () => {
  it('converts Celsius to Fahrenheit', () => {
    expect(convertTemperature(0, 'f')).toBe(32)
    expect(convertTemperature(100, 'f')).toBe(212)
    expect(convertTemperature(21, 'c')).toBe(21)
  })

  it('converts km/h to mph', () => {
    expect(convertWindSpeed(100, 'kmh')).toBe(100)
    expect(convertWindSpeed(160.9344, 'mph')).toBeCloseTo(100, 5)
  })
})

describe('formatting measurements', () => {
  it('formats and rounds temperature with units', () => {
    expect(formatTemperature(9.4, 'c')).toBe('9°C')
    expect(formatTemperature(9.6, 'c', { withUnit: false })).toBe('10°')
    expect(formatTemperature(0, 'f')).toBe('32°F')
  })

  it('never shows negative zero', () => {
    expect(formatTemperature(-0.2, 'c')).toBe('0°C')
  })

  it('shows a real zero as zero but missing values as a dash', () => {
    expect(formatTemperature(0, 'c')).toBe('0°C')
    expect(formatPrecipitation(0)).toBe('0 mm')
    expect(formatPercent(0)).toBe('0%')
    for (const value of [null, undefined, Number.NaN]) {
      expect(formatTemperature(value, 'c')).toBe(MISSING)
      expect(formatWindSpeed(value, 'kmh')).toBe(MISSING)
      expect(formatPercent(value)).toBe(MISSING)
      expect(formatPrecipitation(value)).toBe(MISSING)
    }
  })

  it('formats wind speed in the chosen unit', () => {
    expect(formatWindSpeed(13.8, 'kmh')).toBe('14 km/h')
    expect(formatWindSpeed(16.09344, 'mph')).toBe('10 mph')
  })

  it('trims precipitation to one decimal', () => {
    expect(formatPrecipitation(1.26)).toBe('1.3 mm')
    expect(formatPrecipitation(2)).toBe('2 mm')
  })
})

describe('time formatting', () => {
  // 2026-10-24T15:00:00Z is 17:00 in Berlin (CEST) and 08:00 in Los Angeles (PDT).
  const instant = '2026-10-24T15:00:00.000Z'

  it('uses the given time zone, not the browser zone', () => {
    expect(formatTime(instant, 'Europe/Berlin')).toBe('17:00')
    expect(formatTime(instant, 'America/Los_Angeles')).toBe('08:00')
  })

  it('formats a zoned date and time', () => {
    expect(formatDateTime(instant, 'Europe/Berlin')).toContain('17:00')
  })

  it('derives the local calendar date in the zone', () => {
    const lateEvening = '2026-10-24T23:30:00.000Z'
    expect(toLocalDate(lateEvening, 'Europe/Berlin')).toBe('2026-10-25')
    expect(toLocalDate(lateEvening, 'America/Los_Angeles')).toBe('2026-10-24')
  })

  it('formats a local date without shifting the day', () => {
    expect(formatLocalDate('2026-10-24')).toBe('Sat 24 Oct')
  })

  it('returns a dash for invalid input', () => {
    expect(formatTime('not a date', 'Europe/Berlin')).toBe(MISSING)
    expect(formatDateTime('nope', 'Europe/Berlin')).toBe(MISSING)
    expect(toLocalDate('nope', 'Europe/Berlin')).toBeNull()
    expect(formatLocalDate('nope')).toBe(MISSING)
    expect(formatAge('nope')).toBe(MISSING)
  })

  it('describes age coarsely', () => {
    const now = Date.parse('2026-10-24T15:00:00Z')
    expect(formatAge('2026-10-24T14:59:50Z', now)).toBe('just now')
    expect(formatAge('2026-10-24T14:55:00Z', now)).toBe('5 min ago')
    expect(formatAge('2026-10-24T12:00:00Z', now)).toBe('3 h ago')
    expect(formatAge('2026-10-20T15:00:00Z', now)).toBe('4 days ago')
  })
})
