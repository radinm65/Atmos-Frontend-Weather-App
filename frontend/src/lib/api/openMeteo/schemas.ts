import { z } from 'zod'

/**
 * Shapes of the Open-Meteo responses we rely on. Unknown fields are ignored. Measurement
 * arrays may contain nulls, and whole variables may be absent, so everything optional is
 * treated as "missing", never as zero.
 */

const maybeNumber = z.number().nullish()
const numberSeries = z.array(z.number().nullable()).optional()

export const geocodingResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().optional(),
  country: z.string().optional(),
  admin1: z.string().optional(),
})

/** `results` is omitted entirely when nothing matches. */
export const geocodingResponseSchema = z.object({
  results: z.array(geocodingResultSchema).optional(),
})

export const forecastResponseSchema = z.object({
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.number(),
    temperature_2m: maybeNumber,
    apparent_temperature: maybeNumber,
    relative_humidity_2m: maybeNumber,
    wind_speed_10m: maybeNumber,
    precipitation: maybeNumber,
    weather_code: maybeNumber,
    is_day: maybeNumber,
  }),
  hourly: z.object({
    time: z.array(z.number()),
    temperature_2m: numberSeries,
    precipitation_probability: numberSeries,
    weather_code: numberSeries,
    is_day: numberSeries,
  }),
  daily: z.object({
    time: z.array(z.number()),
    temperature_2m_max: numberSeries,
    temperature_2m_min: numberSeries,
    precipitation_probability_max: numberSeries,
    precipitation_sum: numberSeries,
    weather_code: numberSeries,
  }),
})

export type GeocodingResult = z.infer<typeof geocodingResultSchema>
export type GeocodingResponse = z.infer<typeof geocodingResponseSchema>
export type ForecastResponse = z.infer<typeof forecastResponseSchema>
