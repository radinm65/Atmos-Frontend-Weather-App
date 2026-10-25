import { describe, expect, it } from 'vitest'
import type { WeatherCondition } from '../../domain/weather'
import { luminance, mix, hexToRgb } from './color'
import { computeSkyState, precipitationIntensity } from './skyState'
import type { SkyInput } from './skyState'

const cond = (
  category: WeatherCondition['category'],
  code: number | null = null,
): WeatherCondition => ({
  category,
  label: category,
  code,
})

// Berlin, 2026-10-24: sunrise 04:48Z, sunset 15:20Z.
const base: SkyInput = {
  time: '2026-10-24T10:04:00.000Z', // solar noon
  timezone: 'Europe/Berlin',
  sunrise: '2026-10-24T04:48:00.000Z',
  sunset: '2026-10-24T15:20:00.000Z',
  previousSunset: '2026-10-23T15:22:00.000Z',
  nextSunrise: '2026-10-25T05:49:00.000Z',
  isDay: true,
  condition: cond('clear', 0),
  cloudCover: 0,
  windSpeed: 10,
}

const at = (time: string, overrides: Partial<SkyInput> = {}) =>
  computeSkyState({ ...base, time, ...overrides })

const saturation = (hex: string) => {
  const [r, g, b] = hexToRgb(hex)
  return Math.max(r, g, b) - Math.min(r, g, b)
}

describe('sun and moon', () => {
  it('puts the sun at its highest at solar noon, with a bright blue sky', () => {
    const noon = at('2026-10-24T10:04:00.000Z')
    expect(noon.altitude).toBeCloseTo(1, 1)
    expect(noon.sun).toMatchObject({ y: expect.closeTo(1, 1), visible: 1 })
    expect(noon.sun.x).toBeCloseTo(0.5, 1)
    expect(noon.moon.visible).toBe(0)
    expect(noon.stars).toBe(0)
    expect(luminance(noon.colors.top)).toBeGreaterThan(70)
  })

  it('moves the sun from left to right across the day', () => {
    const morning = at('2026-10-24T07:00:00.000Z').sun
    const afternoon = at('2026-10-24T13:00:00.000Z').sun
    expect(morning.x).toBeLessThan(0.5)
    expect(afternoon.x).toBeGreaterThan(0.5)
  })

  it('places the sun on the horizon at sunrise and sunset, with a warm glow', () => {
    const sunrise = at('2026-10-24T04:48:00.000Z')
    expect(sunrise.altitude).toBeCloseTo(0, 5)
    expect(sunrise.sun.y).toBeCloseTo(0, 5)
    // Warm: red clearly exceeds blue in the horizon glow.
    const [r, , b] = hexToRgb(sunrise.colors.glow)
    expect(r).toBeGreaterThan(b)
  })

  it('shows the moon and stars at night, and no sun', () => {
    const night = at('2026-10-23T22:00:00.000Z', { isDay: false })
    expect(night.altitude).toBeLessThan(-0.5)
    expect(night.sun.visible).toBe(0)
    expect(night.moon.visible).toBeGreaterThan(0.9)
    expect(night.stars).toBeGreaterThan(0.9)
    expect(luminance(night.colors.top)).toBeLessThan(15)
  })

  it('keeps the moon arc continuous across midnight using neighbouring sun times', () => {
    const beforeMidnight = at('2026-10-24T20:00:00.000Z').moon.x
    const afterMidnight = at('2026-10-25T01:00:00.000Z', {
      sunrise: base.nextSunrise ?? null,
      sunset: '2026-10-25T15:18:00.000Z',
      previousSunset: base.sunset,
    }).moon.x
    expect(afterMidnight).toBeGreaterThan(beforeMidnight)
  })

  it('is darker after dusk than at noon and gets darker through the evening', () => {
    const noon = luminance(at('2026-10-24T10:04:00.000Z').colors.top)
    const dusk = luminance(at('2026-10-24T15:50:00.000Z').colors.top)
    const lateEvening = luminance(at('2026-10-24T18:30:00.000Z').colors.top)
    expect(dusk).toBeLessThan(noon)
    expect(lateEvening).toBeLessThan(dusk)
  })

  it('falls back to the provider day/night flag without sun times', () => {
    const noSun = { sunrise: null, sunset: null }
    expect(at('2026-06-21T12:00:00.000Z', { ...noSun, isDay: true }).altitude).toBeGreaterThan(0)
    expect(at('2026-12-21T12:00:00.000Z', { ...noSun, isDay: false }).altitude).toBeLessThan(0)
  })

  it('falls back to the local clock when there is neither sun data nor a flag', () => {
    const none = { sunrise: null, sunset: null, isDay: null }
    // 10:00Z is 12:00 in Berlin (CEST): day. 22:00Z is 00:00 there: night.
    expect(at('2026-06-21T10:00:00.000Z', none).altitude).toBeGreaterThan(0.9)
    expect(at('2026-06-21T22:00:00.000Z', none).altitude).toBeLessThan(0)
  })

  it('survives an invalid time without throwing', () => {
    expect(() => computeSkyState({ ...base, time: 'not a time' })).not.toThrow()
  })
})

describe('weather', () => {
  it('draws rain for rain and thunderstorms, snow for snow, nothing for clear', () => {
    expect(at(base.time, { condition: cond('rain', 63) }).precipitation).toEqual({
      kind: 'rain',
      intensity: 0.65,
    })
    expect(at(base.time, { condition: cond('thunderstorm', 95) }).precipitation.kind).toBe('rain')
    expect(at(base.time, { condition: cond('snow', 75) }).precipitation).toEqual({
      kind: 'snow',
      intensity: 1,
    })
    expect(at(base.time).precipitation).toEqual({ kind: 'none', intensity: 0 })
  })

  it('flashes lightning only in thunderstorms', () => {
    expect(at(base.time, { condition: cond('thunderstorm', 95) }).lightning).toBe(true)
    expect(at(base.time, { condition: cond('rain', 63) }).lightning).toBe(false)
  })

  it('adds fog only for fog (and a little for rain)', () => {
    expect(at(base.time, { condition: cond('fog', 45) }).fog).toBeGreaterThan(0.7)
    expect(at(base.time).fog).toBe(0)
  })

  it('makes an overcast sky greyer and darker than a clear one', () => {
    const clear = at(base.time)
    const overcast = at(base.time, { condition: cond('overcast', 3), cloudCover: 100 })
    expect(saturation(overcast.colors.top)).toBeLessThan(saturation(clear.colors.top))
    expect(luminance(overcast.colors.top)).toBeLessThanOrEqual(luminance(clear.colors.top) + 1)
    expect(overcast.cloudAmount).toBe(1)
    expect(overcast.sun.visible).toBeLessThan(clear.sun.visible)
  })

  it('hides stars under heavy cloud at night', () => {
    const clearNight = at('2026-10-23T22:00:00.000Z', { isDay: false })
    const cloudyNight = at('2026-10-23T22:00:00.000Z', {
      isDay: false,
      condition: cond('overcast', 3),
      cloudCover: 100,
    })
    expect(clearNight.stars).toBeGreaterThan(cloudyNight.stars)
    expect(cloudyNight.stars).toBe(0)
  })

  it('uses provider cloud cover when given and a category default otherwise', () => {
    expect(at(base.time, { cloudCover: 60 }).cloudAmount).toBeCloseTo(0.6)
    expect(at(base.time, { cloudCover: null, condition: cond('overcast', 3) }).cloudAmount).toBe(1)
  })

  it('shows a calm, neutral sky for unknown or missing conditions', () => {
    const unknown = at(base.time, { condition: null, cloudCover: null })
    expect(unknown.condition).toBe('unknown')
    expect(unknown.precipitation.kind).toBe('none')
    expect(unknown.lightning).toBe(false)
    expect(unknown.fog).toBe(0)
  })

  it('drifts clouds faster in stronger wind, with a default when wind is unknown', () => {
    const calm = at(base.time, { windSpeed: 0 }).windDrift
    const gale = at(base.time, { windSpeed: 80 }).windDrift
    expect(gale).toBeGreaterThan(calm)
    expect(at(base.time, { windSpeed: null }).windDrift).toBeGreaterThan(0)
  })
})

describe('precipitationIntensity', () => {
  it('grades light, moderate and heavy codes', () => {
    expect(precipitationIntensity(cond('rain', 61))).toBe(0.35)
    expect(precipitationIntensity(cond('rain', 63))).toBe(0.65)
    expect(precipitationIntensity(cond('rain', 65))).toBe(1)
    expect(precipitationIntensity(cond('rain', null))).toBe(0.5)
    expect(precipitationIntensity(null)).toBe(0.5)
  })
})

describe('colour helpers', () => {
  it('mixes colours linearly', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#102030', '#102030', 0.7)).toBe('#102030')
  })
})
