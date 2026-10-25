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
      wind_gusts_10m: 45.4,
      wind_direction_10m: 202,
      precipitation: 0,
      pressure_msl: 996.4,
      uv_index: 0.45,
      visibility: 25120,
      dew_point_2m: 7.8,
      cloud_cover: 100,
      weather_code: 3,
      is_day: 0,
    },
    hourly: {
      time: [DAY_1, DAY_1 + 3600, DAY_1 + 7200],
      temperature_2m: [11.4, null, 11.3],
      apparent_temperature: [9.8, 9.5, null],
      relative_humidity_2m: [80, 85, null],
      precipitation_probability: [8, 0, null],
      precipitation: [0, 0.4, null],
      weather_code: [3, 61, null],
      cloud_cover: [100, 92, null],
      wind_speed_10m: [12.1, 14.0, null],
      wind_gusts_10m: [30.2, 33.0, null],
      pressure_msl: [997.1, 996.8, null],
      uv_index: [0, 0.2, null],
      is_day: [0, 0, 1],
    },
    daily: {
      time: [DAY_1, DAY_2, DAY_3],
      temperature_2m_max: [12.0, 9.5, null],
      temperature_2m_min: [7.3, 6.1, null],
      precipitation_probability_max: [88, 10, null],
      precipitation_sum: [1.2, 0, null],
      precipitation_hours: [6, 0, null],
      uv_index_max: [1.3, 1.5, null],
      wind_speed_10m_max: [23.9, 18.5, null],
      wind_gusts_10m_max: [52.6, 41.2, null],
      daylight_duration: [36040.32, 35809.97, null],
      sunshine_duration: [13203.4, 30358.02, null],
      weather_code: [61, 3, null],
      sunrise: [DAY_1 + 24480, DAY_2 + 28140, null], // 06:48 CEST, 06:49 CET, missing
      sunset: [DAY_1 + 62400, DAY_2 + 62280, null], // 17:20 CEST, 16:18 CET, missing
    },
  }
}

export function airQualityFixture() {
  return {
    current: {
      time: CURRENT_TIME,
      us_aqi: 29,
      european_aqi: 22,
      pm2_5: 1.1,
      pm10: 1.7,
      ozone: 63,
      nitrogen_dioxide: 5.3,
      sulphur_dioxide: 0.7,
      carbon_monoxide: 154,
    },
    hourly: { time: [CURRENT_TIME, CURRENT_TIME + 3600], us_aqi: [29, null] },
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
