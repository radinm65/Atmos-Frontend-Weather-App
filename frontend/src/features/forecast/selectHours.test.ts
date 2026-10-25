import { describe, expect, it } from 'vitest'
import type { HourlyForecast } from '../../domain/weather'
import { selectHours } from './selectHours'

const hour = (iso: string): HourlyForecast => ({
  time: iso,
  temperature: 10,
  precipitationProbability: null,
  condition: null,
  cloudCover: null,
  windSpeed: null,
  isDay: null,
})

const hourly = ['09:00', '10:00', '11:00', '12:00'].map((t) => hour(`2026-10-24T${t}:00.000Z`))

describe('selectHours', () => {
  it('starts at the hour containing the reference time', () => {
    const selected = selectHours(hourly, '2026-10-24T10:25:00.000Z', 2)
    expect(selected.map((h) => h.time)).toEqual([
      '2026-10-24T10:00:00.000Z',
      '2026-10-24T11:00:00.000Z',
    ])
  })

  it('returns fewer entries when the forecast ends sooner', () => {
    expect(selectHours(hourly, '2026-10-24T11:00:00.000Z', 24)).toHaveLength(2)
  })

  it('returns nothing when the reference is after the forecast', () => {
    expect(selectHours(hourly, '2026-10-25T00:00:00.000Z', 24)).toEqual([])
  })

  it('falls back to the start of the list for an invalid reference time', () => {
    expect(selectHours(hourly, 'nope', 3)).toHaveLength(3)
  })
})
