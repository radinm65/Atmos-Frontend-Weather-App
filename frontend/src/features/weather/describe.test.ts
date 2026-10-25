import { describe, expect, it } from 'vitest'
import {
  compassDirection,
  describeFeelsLike,
  describeHumidity,
  describePressure,
  describeUv,
  describeVisibility,
  describeWind,
  pressureTrend,
} from './describe'
import { WEATHER_ICONS, weatherIconKey } from './weatherIcons'

describe('compassDirection', () => {
  it('names the 16 compass points and wraps around', () => {
    expect(compassDirection(0)).toBe('N')
    expect(compassDirection(90)).toBe('E')
    expect(compassDirection(202)).toBe('SSW')
    expect(compassDirection(270)).toBe('W')
    expect(compassDirection(359)).toBe('N')
    expect(compassDirection(360)).toBe('N')
    expect(compassDirection(-90)).toBe('W')
  })
})

describe('describeUv', () => {
  it('uses the WHO bands with advice', () => {
    expect(describeUv(0.4).label).toBe('Low')
    expect(describeUv(3).label).toBe('Moderate')
    expect(describeUv(6).label).toBe('High')
    expect(describeUv(8).label).toBe('Very high')
    expect(describeUv(11).label).toBe('Extreme')
    expect(describeUv(5).advice).toMatch(/sunscreen/i)
  })

  it('keeps the gauge fraction between 0 and 1', () => {
    expect(describeUv(0).fraction).toBe(0)
    expect(describeUv(20).fraction).toBe(1)
  })
})

describe('describeVisibility', () => {
  it('describes how far you can see', () => {
    expect(describeVisibility(500).label).toBe('Very poor')
    expect(describeVisibility(3000).label).toBe('Poor')
    expect(describeVisibility(8000).label).toBe('Moderate')
    expect(describeVisibility(15000).label).toBe('Good')
    expect(describeVisibility(25120).label).toBe('Excellent')
  })
})

describe('other descriptors', () => {
  it('describes humidity, wind and pressure', () => {
    expect(describeHumidity(20)).toBe('Dry')
    expect(describeHumidity(45)).toBe('Comfortable')
    expect(describeHumidity(70)).toBe('Humid')
    expect(describeHumidity(95)).toBe('Very humid')
    expect(describeWind(0)).toBe('Calm')
    expect(describeWind(19)).toBe('Moderate breeze')
    expect(describeWind(90)).toBe('Storm')
    expect(describePressure(996)).toBe('Low')
    expect(describePressure(1013)).toBe('Normal')
    expect(describePressure(1030)).toBe('High')
  })

  it('detects pressure trend, and says nothing when data is missing', () => {
    expect(pressureTrend(1000, 1004)).toBe('rising')
    expect(pressureTrend(1000, 996)).toBe('falling')
    expect(pressureTrend(1000, 1000.4)).toBe('steady')
    expect(pressureTrend(null, 1000)).toBeNull()
    expect(pressureTrend(1000, null)).toBeNull()
  })

  it('compares feels-like with the air temperature', () => {
    expect(describeFeelsLike(10, 10.5)).toMatch(/same/)
    expect(describeFeelsLike(10, 6)).toMatch(/colder/)
    expect(describeFeelsLike(10, 14)).toMatch(/warmer/)
  })
})

describe('weatherIconKey', () => {
  it('picks day and night variants', () => {
    expect(weatherIconKey(0, 'clear', false)).toBe('nightClear')
    expect(weatherIconKey(0, 'clear', true)).toBe('daySunny')
    expect(weatherIconKey(81, 'rain', true)).toBe('dayShowers')
    expect(weatherIconKey(63, 'rain', false)).toBe('rain')
    expect(weatherIconKey(99, 'thunderstorm', true)).toBe('thunderstorm')
  })

  it('treats an unknown day/night flag as day', () => {
    expect(weatherIconKey(2, 'partly-cloudy', null)).toBe('dayCloudy')
  })

  it('falls back to the category, then to a neutral icon', () => {
    expect(weatherIconKey(null, 'rain', true)).toBe('rain')
    expect(weatherIconKey(1234, 'thunderstorm', true)).toBe('thunderstorm')
    expect(weatherIconKey(null, 'unknown', true)).toBe('unknown')
  })

  it('maps every key to a real icon component', () => {
    for (const Icon of Object.values(WEATHER_ICONS)) expect(typeof Icon).toBe('function')
  })
})
