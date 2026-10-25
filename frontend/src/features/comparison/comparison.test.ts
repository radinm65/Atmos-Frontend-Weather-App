import { describe, expect, it } from 'vitest'
import type { WeatherReport } from '../../domain/weather'
import { DEFAULT_UNITS, formatTime } from '../../lib/formatting'
import { fixtureReport } from '../../test/fakeSource'
import { buildCompareChart, buildCompareRows, markExtremes } from './comparison'

describe('markExtremes', () => {
  it('marks the highest and lowest of several values', () => {
    expect(markExtremes([10, 25, 18])).toEqual(['lowest', 'highest', null])
  })

  it('marks nothing for a single value, ties, or all-equal values', () => {
    expect(markExtremes([10])).toEqual([null])
    expect(markExtremes([10, 10])).toEqual([null, null])
    expect(markExtremes([5, null, null])).toEqual([null, null, null])
  })

  it('ignores missing values when marking the rest', () => {
    expect(markExtremes([null, 4, 9])).toEqual([null, 'lowest', 'highest'])
  })

  it('treats zero as a real value, not as missing', () => {
    expect(markExtremes([0, 5])).toEqual(['lowest', 'highest'])
  })

  it('marks every city that shares the extreme', () => {
    expect(markExtremes([1, 9, 9])).toEqual(['lowest', 'highest', 'highest'])
  })
})

function report(overrides: Partial<WeatherReport['current']>): WeatherReport {
  const base = fixtureReport()
  return { ...base, current: { ...base.current, ...overrides } }
}

const row = (rows: ReturnType<typeof buildCompareRows>, id: string) =>
  rows.find((r) => r.id === id)!

describe('buildCompareRows', () => {
  const cold = report({ temperature: 2, windSpeed: 30, humidity: 90 })
  const warm = report({ temperature: 24, windSpeed: 8, humidity: 40 })

  it('has one cell per city for every metric', () => {
    const rows = buildCompareRows([cold, warm], DEFAULT_UNITS)
    expect(rows.length).toBeGreaterThanOrEqual(10)
    for (const r of rows) expect(r.cells).toHaveLength(2)
  })

  it('formats in the chosen units and marks the extremes', () => {
    const metric = buildCompareRows([cold, warm], DEFAULT_UNITS)
    expect(row(metric, 'temperature').cells).toEqual([
      { text: '2°C', mark: 'lowest' },
      { text: '24°C', mark: 'highest' },
    ])
    expect(row(metric, 'wind').cells.map((c) => c.text)).toEqual(['30 km/h', '8 km/h'])

    const imperial = buildCompareRows([cold, warm], { temperature: 'f', windSpeed: 'mph' })
    expect(row(imperial, 'temperature').cells.map((c) => c.text)).toEqual(['36°F', '75°F'])
    expect(row(imperial, 'wind').cells.map((c) => c.text)).toEqual(['19 mph', '5 mph'])
    // Converting units never changes which city is highest.
    expect(row(imperial, 'temperature').cells.map((c) => c.mark)).toEqual(['lowest', 'highest'])
  })

  it('shows a dash for a city without data and keeps comparing the rest', () => {
    const rows = buildCompareRows([cold, null, warm], DEFAULT_UNITS)
    expect(row(rows, 'temperature').cells.map((c) => c.text)).toEqual(['2°C', '—', '24°C'])
    expect(row(rows, 'temperature').cells.map((c) => c.mark)).toEqual(['lowest', null, 'highest'])
  })

  it('marks nothing when only one city has data', () => {
    const rows = buildCompareRows([cold, null], DEFAULT_UNITS)
    expect(row(rows, 'temperature').cells.map((c) => c.mark)).toEqual([null, null])
  })

  it('uses a real zero (not a dash) for zero precipitation', () => {
    const rows = buildCompareRows([cold, warm], DEFAULT_UNITS)
    const base = fixtureReport()
    expect(base.daily[1]?.precipitationSum).toBe(0)
    expect(row(rows, 'precipitation').cells[0]?.text).toMatch(/mm$/)
  })
})

describe('buildCompareChart', () => {
  const local = (iso: string, tz: string) => formatTime(iso, tz)

  it('aligns cities by elapsed hours and keeps each city’s own local time', () => {
    const berlin = fixtureReport()
    const tokyo: WeatherReport = { ...fixtureReport(), timezone: 'Asia/Tokyo' }
    const { series, rows } = buildCompareChart(
      [{ name: 'Berlin' }, { name: 'Tokyo' }],
      [berlin, tokyo],
      DEFAULT_UNITS,
      local,
    )
    expect(series).toEqual([
      { key: 'c0', name: 'Berlin' },
      { key: 'c1', name: 'Tokyo' },
    ])
    expect(rows[0]).toMatchObject({ offset: 0, label: 'Now', c0: 11.4, c1: 11.4 })
    // Same instant, different local clocks: 16:00 UTC is 18:00 in Berlin and 01:00 next day in Tokyo.
    expect(rows[0]?.['c0-time']).toBe('18:00')
    expect(rows[0]?.['c1-time']).toBe('01:00')
  })

  it('converts temperatures to the chosen unit', () => {
    const { rows } = buildCompareChart(
      [{ name: 'A' }],
      [fixtureReport()],
      { temperature: 'f', windSpeed: 'kmh' },
      local,
    )
    expect(rows[0]?.c0).toBeCloseTo(52.52, 1)
  })

  it('leaves a gap (not a zero) for a city without data', () => {
    const { rows } = buildCompareChart(
      [{ name: 'A' }, { name: 'B' }],
      [fixtureReport(), null],
      DEFAULT_UNITS,
      local,
    )
    expect(rows[0]?.c1).toBeNull()
    expect(rows[0]?.['c1-time']).toBeNull()
  })

  it('returns no rows when nothing has data', () => {
    expect(buildCompareChart([{ name: 'A' }], [null], DEFAULT_UNITS, local).rows).toEqual([])
  })
})
