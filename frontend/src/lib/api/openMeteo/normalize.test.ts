import { describe, expect, it } from 'vitest'
import { aqiCategory } from '../../../domain/airQuality'
import {
  airQualityResponseSchema,
  forecastResponseSchema,
  geocodingResponseSchema,
} from './schemas'
import { normalizeAirQuality, normalizeForecast, normalizeGeocoding } from './normalize'
import { conditionFromCode } from './wmo'
import {
  CURRENT_TIME,
  airQualityFixture,
  berlin,
  forecastFixture,
  geocodingFixture,
} from './testFixtures'

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
    expect(hourly[0]?.time).toBe(new Date(CURRENT_TIME * 1000).toISOString())
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

  it('maps cloud cover and hourly wind for the sky scene', () => {
    const report = normalize()
    expect(report.current.cloudCover).toBe(100)
    expect(report.hourly[1]).toMatchObject({ cloudCover: 92, windSpeed: 14 })
    expect(report.hourly[2]).toMatchObject({ cloudCover: null, windSpeed: null })
  })

  it('maps the extra current measurements (wind, pressure, UV, visibility, dew point)', () => {
    expect(normalize().current).toMatchObject({
      windGusts: 45.4,
      windDirection: 202,
      pressure: 996.4,
      uvIndex: 0.45,
      visibility: 25120,
      dewPoint: 7.8,
    })
  })

  it('maps hourly and daily detail, keeping gaps as null', () => {
    const { hourly, daily } = normalize()
    expect(hourly[1]).toMatchObject({
      feelsLike: 9.5,
      humidity: 85,
      precipitation: 0.4,
      windGusts: 33,
      pressure: 996.8,
      uvIndex: 0.2,
    })
    expect(hourly[2]).toMatchObject({ feelsLike: null, precipitation: null, uvIndex: null })
    expect(daily[0]).toMatchObject({
      uvIndexMax: 1.3,
      windSpeedMax: 23.9,
      windGustsMax: 52.6,
      precipitationHours: 6,
      sunshineSeconds: 13203.4,
    })
    expect(daily[2]).toMatchObject({ uvIndexMax: null, daylightSeconds: null })
  })

  it('maps sunrise and sunset as UTC instants, keeping missing ones null', () => {
    const { daily } = normalize()
    // 06:48 CEST on 2026-10-24 is 04:48 UTC; 16:18 CET on 2026-10-25 is 15:18 UTC.
    expect(daily[0]?.sunrise).toBe('2026-10-24T04:48:00.000Z')
    expect(daily[1]?.sunset).toBe('2026-10-25T15:18:00.000Z')
    expect(daily[2]).toMatchObject({ sunrise: null, sunset: null })
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

describe('normalizeAirQuality', () => {
  it('maps pollutants and the hourly index, keeping gaps as null', () => {
    const report = normalizeAirQuality(
      airQualityResponseSchema.parse(airQualityFixture()),
      { kind: 'live' },
      fetchedAt,
    )
    expect(report).toMatchObject({
      usAqi: 29,
      europeanAqi: 22,
      pm25: 1.1,
      pm10: 1.7,
      ozone: 63,
      nitrogenDioxide: 5.3,
      sulphurDioxide: 0.7,
      carbonMonoxide: 154,
      fetchedAt,
      source: { kind: 'live' },
    })
    expect(report.hourly).toEqual([
      { time: new Date(CURRENT_TIME * 1000).toISOString(), usAqi: 29 },
      { time: new Date((CURRENT_TIME + 3600) * 1000).toISOString(), usAqi: null },
    ])
  })

  it('treats missing pollutants as null, not zero', () => {
    const report = normalizeAirQuality(
      airQualityResponseSchema.parse({ current: { time: CURRENT_TIME }, hourly: { time: [] } }),
      { kind: 'live' },
      fetchedAt,
    )
    expect(report.usAqi).toBeNull()
    expect(report.pm25).toBeNull()
  })

  it('classifies US AQI bands', () => {
    expect(aqiCategory(29)).toBe('good')
    expect(aqiCategory(50)).toBe('good')
    expect(aqiCategory(51)).toBe('moderate')
    expect(aqiCategory(120)).toBe('sensitive')
    expect(aqiCategory(180)).toBe('unhealthy')
    expect(aqiCategory(250)).toBe('very-unhealthy')
    expect(aqiCategory(400)).toBe('hazardous')
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
