import { describe, expect, it } from 'vitest'
import { forecastResponseSchema, geocodingResponseSchema } from './schemas'
import { normalizeForecast, normalizeGeocoding } from './normalize'
import { conditionFromCode } from './wmo'
import { CURRENT_TIME, DAY_1, berlin, forecastFixture, geocodingFixture } from './testFixtures'

const source = { kind: 'live' } as const
const fetchedAt = '2026-10-24T16:01:00.000Z'

function normalize(raw: unknown = forecastFixture()) {
  return normalizeForecast(forecastResponseSchema.parse(raw), berlin, source, fetchedAt)
}

describe('normalizeForecast', () => {
  it('maps current conditions with metric values and a UTC instant', () => {
    const { current } = normalize()
    expect(current).toMatchObject({
      temperature: 9.4,
      feelsLike: 6.5,
      humidity: 82,
      windSpeed: 13.8,
      precipitation: 0,
      isDay: false,
      observedAt: new Date(CURRENT_TIME * 1000).toISOString(),
    })
    expect(current.condition).toEqual({ category: 'overcast', label: 'Overcast', code: 3 })
  })

  it('keeps a real zero precipitation as zero', () => {
    expect(normalize().current.precipitation).toBe(0)
  })

  it('records the provider time zone on the report and the location', () => {
    const report = normalize()
    expect(report.timezone).toBe('Europe/Berlin')
    expect(report.location.timezone).toBe('Europe/Berlin')
    expect(report.utcOffsetSeconds).toBe(7200)
    expect(report.fetchedAt).toBe(fetchedAt)
    expect(report.source).toEqual({ kind: 'live' })
  })

  it('turns missing hourly values into null, not zero', () => {
    const { hourly } = normalize()
    expect(hourly).toHaveLength(3)
    expect(hourly[0]).toMatchObject({
      temperature: 11.4,
      precipitationProbability: 8,
      isDay: false,
    })
    expect(hourly[0]?.time).toBe(new Date(DAY_1 * 1000).toISOString())
    expect(hourly[1]?.temperature).toBeNull()
    expect(hourly[2]).toMatchObject({
      precipitationProbability: null,
      condition: null,
      isDay: true,
    })
  })

  it('derives local calendar dates across a daylight-saving change', () => {
    const { daily } = normalize()
    expect(daily.map((day) => day.date)).toEqual(['2026-10-24', '2026-10-25', '2026-10-26'])
  })

  it('keeps missing daily values as null', () => {
    const last = normalize().daily[2]
    expect(last).toMatchObject({
      minTemperature: null,
      maxTemperature: null,
      condition: null,
      precipitationProbability: null,
      precipitationSum: null,
    })
  })

  it('treats a missing series as all-null', () => {
    const raw = forecastFixture()
    const sparse = {
      ...raw,
      current: { time: raw.current.time },
      hourly: { time: raw.hourly.time },
      daily: { time: raw.daily.time },
    }
    const report = normalize(sparse)
    expect(report.current).toMatchObject({
      temperature: null,
      humidity: null,
      isDay: null,
      condition: { category: 'unknown', code: null },
    })
    expect(report.hourly.every((hour) => hour.temperature === null)).toBe(true)
    expect(report.daily.every((day) => day.maxTemperature === null)).toBe(true)
  })

  it('rejects a payload that is missing required structure', () => {
    const { current, ...withoutCurrent } = forecastFixture()
    expect(current).toBeDefined()
    expect(forecastResponseSchema.safeParse(withoutCurrent).success).toBe(false)
    expect(forecastResponseSchema.safeParse({ ...forecastFixture(), timezone: 5 }).success).toBe(
      false,
    )
  })
})

describe('normalizeGeocoding', () => {
  it('maps results to locations with app-level ids and region/country', () => {
    const results = normalizeGeocoding(geocodingResponseSchema.parse(geocodingFixture()))
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      id: 'om:2950159',
      name: 'Berlin',
      region: 'State of Berlin',
      country: 'Germany',
      timezone: 'Europe/Berlin',
    })
    expect(results[1]?.country).toBe('United States')
  })

  it('returns an empty list when the provider omits "results"', () => {
    expect(normalizeGeocoding(geocodingResponseSchema.parse({ generationtime_ms: 0.2 }))).toEqual(
      [],
    )
  })
})

describe('conditionFromCode', () => {
  it('groups codes into photography categories', () => {
    expect(conditionFromCode(0).category).toBe('clear')
    expect(conditionFromCode(2).category).toBe('partly-cloudy')
    expect(conditionFromCode(45).category).toBe('fog')
    expect(conditionFromCode(81).category).toBe('rain')
    expect(conditionFromCode(75).category).toBe('snow')
    expect(conditionFromCode(99).category).toBe('thunderstorm')
  })

  it('never guesses for missing or unrecognised codes', () => {
    expect(conditionFromCode(null)).toMatchObject({ category: 'unknown', code: null })
    expect(conditionFromCode(undefined).category).toBe('unknown')
    expect(conditionFromCode(1234)).toMatchObject({ category: 'unknown', code: 1234 })
  })
})
