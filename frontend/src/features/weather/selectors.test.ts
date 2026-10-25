import { describe, expect, it } from 'vitest'
import { fixtureReport } from '../../test/fakeSource'
import { dailyForToday, daylightProgress, hoursFromNow, temperatureExtent } from './selectors'
import { temperatureColor } from './tempColor'

describe('dailyForToday', () => {
  it('finds the day matching the local date of the observation', () => {
    const report = fixtureReport()
    // Observed 2026-10-24T16:00Z is still 24 Oct in Berlin.
    expect(dailyForToday(report)?.date).toBe('2026-10-24')
  })

  it('falls back to the first day when none matches', () => {
    const report = fixtureReport()
    report.current = { ...report.current, observedAt: '2030-01-01T00:00:00.000Z' }
    expect(dailyForToday(report)?.date).toBe(report.daily[0]?.date)
  })

  it('returns null for a report with no days', () => {
    const report = fixtureReport()
    report.daily = []
    expect(dailyForToday(report)).toBeNull()
  })
})

describe('hoursFromNow', () => {
  it('starts at the observation hour', () => {
    const report = fixtureReport()
    expect(hoursFromNow(report, 2).length).toBeLessThanOrEqual(2)
  })
})

describe('temperatureExtent', () => {
  it('spans every known min and max, ignoring gaps', () => {
    expect(temperatureExtent(fixtureReport().daily)).toEqual([6.1, 12])
  })

  it('is null when nothing is known', () => {
    const report = fixtureReport()
    expect(temperatureExtent(report.daily.slice(2))).toBeNull()
    expect(temperatureExtent([])).toBeNull()
  })
})

describe('daylightProgress', () => {
  const sunrise = '2026-10-24T06:00:00.000Z'
  const sunset = '2026-10-24T18:00:00.000Z'

  it('is 0 at sunrise, 0.5 at midday and 1 at sunset', () => {
    expect(daylightProgress(sunrise, sunrise, sunset)).toBe(0)
    expect(daylightProgress('2026-10-24T12:00:00.000Z', sunrise, sunset)).toBe(0.5)
    expect(daylightProgress(sunset, sunrise, sunset)).toBe(1)
  })

  it('is null at night or without sun times', () => {
    expect(daylightProgress('2026-10-24T22:00:00.000Z', sunrise, sunset)).toBeNull()
    expect(daylightProgress('2026-10-24T03:00:00.000Z', sunrise, sunset)).toBeNull()
    expect(daylightProgress('2026-10-24T12:00:00.000Z', null, sunset)).toBeNull()
    expect(daylightProgress('2026-10-24T12:00:00.000Z', sunset, sunrise)).toBeNull()
  })
})

describe('temperatureColor', () => {
  it('runs from cold blue to hot red and clamps outside the range', () => {
    expect(temperatureColor(-40)).toBe(temperatureColor(-15))
    expect(temperatureColor(60)).toBe(temperatureColor(42))
    const cold = temperatureColor(-5)
    const hot = temperatureColor(36)
    // Blue channel dominates cold; red dominates hot.
    expect(Number.parseInt(cold.slice(5, 7), 16)).toBeGreaterThan(
      Number.parseInt(cold.slice(1, 3), 16),
    )
    expect(Number.parseInt(hot.slice(1, 3), 16)).toBeGreaterThan(
      Number.parseInt(hot.slice(5, 7), 16),
    )
  })

  it('returns a valid hex colour at every step', () => {
    for (let t = -20; t <= 45; t += 1) expect(temperatureColor(t)).toMatch(/^#[0-9a-f]{6}$/)
  })
})
