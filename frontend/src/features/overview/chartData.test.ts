import { describe, expect, it } from 'vitest'
import type { HourlyForecast } from '../../domain/weather'
import { summarizeTemperatureRows, summarizeWindRows, toChartRows } from './chartData'

const hour = (iso: string, temperature: number | null, pop: number | null): HourlyForecast => ({
  time: iso,
  temperature,
  feelsLike: temperature === null ? null : temperature - 2,
  humidity: null,
  precipitationProbability: pop,
  precipitation: null,
  condition: null,
  cloudCover: null,
  windSpeed: null,
  windGusts: null,
  pressure: null,
  uvIndex: null,
  isDay: null,
})

const hours = [
  hour('2026-10-24T13:00:00.000Z', 10, 5),
  hour('2026-10-24T14:00:00.000Z', 12.4, 60),
  hour('2026-10-24T15:00:00.000Z', null, null),
  hour('2026-10-24T16:00:00.000Z', 8, 0),
]

describe('toChartRows', () => {
  it('labels hours in the location time zone', () => {
    const rows = toChartRows(hours, 'Europe/Berlin', 'c')
    expect(rows.map((row) => row.label)).toEqual(['15:00', '16:00', '17:00', '18:00'])
  })

  it('converts temperatures for display and keeps gaps as null', () => {
    const rows = toChartRows(hours, 'Europe/Berlin', 'f')
    expect(rows[0]?.temperature).toBe(50)
    expect(rows[2]?.temperature).toBeNull()
    expect(rows[2]?.feelsLike).toBeNull()
  })
})

describe('wind rows', () => {
  const windy = [
    { ...hour('2026-10-24T13:00:00.000Z', 10, 0), windSpeed: 12, windGusts: 30 },
    { ...hour('2026-10-24T14:00:00.000Z', 10, 0), windSpeed: 24, windGusts: 52 },
    { ...hour('2026-10-24T15:00:00.000Z', 10, 0), windSpeed: null, windGusts: null },
  ]

  it('converts wind speed and gusts to the chosen unit', () => {
    const kmh = toChartRows(windy, 'Europe/Berlin', 'c', 'kmh')
    const mph = toChartRows(windy, 'Europe/Berlin', 'c', 'mph')
    expect(kmh[1]?.windSpeed).toBe(24)
    expect(mph[1]?.windSpeed).toBeCloseTo(14.9, 1)
    expect(kmh[2]?.windSpeed).toBeNull()
  })

  it('summarizes the peak wind and gusts in words', () => {
    const rows = toChartRows(windy, 'Europe/Berlin', 'c', 'kmh')
    expect(summarizeWindRows(rows, 'km/h')).toBe(
      'Wind peaks at 24 km/h at 16:00. Gusts reach 52 km/h.',
    )
  })

  it('says so when there is no wind data', () => {
    const rows = toChartRows([hour('2026-10-24T13:00:00.000Z', 10, 0)], 'Europe/Berlin', 'c')
    expect(summarizeWindRows(rows, 'km/h')).toMatch(/not available/)
  })
})

describe('summarizeTemperatureRows', () => {
  it('describes the high, low and rain chance in words', () => {
    const rows = toChartRows(hours, 'Europe/Berlin', 'c')
    expect(summarizeTemperatureRows(rows, '°')).toBe(
      'Highest 12° at 16:00, lowest 8° at 18:00. Chance of rain peaks at 60%.',
    )
  })

  it('says so when no rain is expected', () => {
    const rows = toChartRows([hour('2026-10-24T13:00:00.000Z', 10, 0)], 'Europe/Berlin', 'c')
    expect(summarizeTemperatureRows(rows, '°')).toContain('No rain expected.')
  })

  it('says so when there is no temperature data', () => {
    const rows = toChartRows([hour('2026-10-24T13:00:00.000Z', null, null)], 'Europe/Berlin', 'c')
    expect(summarizeTemperatureRows(rows, '°')).toMatch(/not available/)
  })
})
