/**
 * TEST-ONLY fixtures. Shaped like real Open-Meteo responses (trimmed from a Berlin request on
 * 2026-10-24). Not weather for display; never import this from app code.
 */
import type { Location } from '../../../domain/location'

export const berlin: Location = {
  id: 'om:2950159',
  name: 'Berlin',
  region: 'State of Berlin',
  country: 'Germany',
  latitude: 52.52437,
  longitude: 13.41053,
}

// Daily instants are local midnight in Europe/Berlin. DST ends on 2026-10-25 at 03:00, so the
// third day starts 25 h after the second.
export const DAY_1 = 1792792800 // 2026-10-24 00:00 CEST
export const DAY_2 = 1792879200 // 2026-10-25 00:00 CEST
export const DAY_3 = 1792969200 // 2026-10-26 00:00 CET
export const CURRENT_TIME = 1792857600 // 2026-10-24T16:00:00Z

export function forecastFixture() {
  return {
    utc_offset_seconds: 7200,
    timezone: 'Europe/Berlin',
    current: {
      time: CURRENT_TIME,
      temperature_2m: 9.4,
      apparent_temperature: 6.5,
      relative_humidity_2m: 82,
      wind_speed_10m: 13.8,
      precipitation: 0,
      weather_code: 3,
      is_day: 0,
    },
    hourly: {
      time: [DAY_1, DAY_1 + 3600, DAY_1 + 7200],
      temperature_2m: [11.4, null, 11.3],
      precipitation_probability: [8, 0, null],
      weather_code: [3, 61, null],
      is_day: [0, 0, 1],
    },
    daily: {
      time: [DAY_1, DAY_2, DAY_3],
      temperature_2m_max: [12.0, 9.5, null],
      temperature_2m_min: [7.3, 6.1, null],
      precipitation_probability_max: [88, 10, null],
      precipitation_sum: [1.2, 0, null],
      weather_code: [61, 3, null],
    },
  }
}

export function geocodingFixture() {
  return {
    results: [
      {
        id: 2950159,
        name: 'Berlin',
        latitude: 52.52437,
        longitude: 13.41053,
        timezone: 'Europe/Berlin',
        country: 'Germany',
        admin1: 'State of Berlin',
        population: 3426354,
      },
      {
        id: 5083330,
        name: 'Berlin',
        latitude: 44.46867,
        longitude: -71.18508,
        timezone: 'America/New_York',
        country: 'United States',
        admin1: 'New Hampshire',
      },
    ],
  }
}
