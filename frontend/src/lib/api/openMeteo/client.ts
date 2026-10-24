import type { Location } from '../../../domain/location'
import { WeatherApiError, isAbortError } from '../errors'
import { forecastResponseSchema, geocodingResponseSchema } from './schemas'
import type { ForecastResponse, GeocodingResponse } from './schemas'

/**
 * Open-Meteo HTTP client (keyless; calls go straight from the browser, D-05/D-06).
 * Only this module and its siblings know provider URLs and raw payloads.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

/** Days of forecast requested. The UI must show what the provider actually returns. */
export const FORECAST_DAYS = 10
const REQUEST_TIMEOUT_MS = 10_000

export interface RequestOptions {
  signal?: AbortSignal
  /** Injectable for tests. Defaults to the global `fetch`. */
  fetchImpl?: typeof fetch
}

export function buildForecastUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    // Resolve the location's own zone and return UTC instants, so no browser-zone guessing.
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: String(FORECAST_DAYS),
  })
  return `${FORECAST_URL}?${params.toString()}`
}

export function buildGeocodingUrl(query: string, count: number): string {
  const params = new URLSearchParams({ name: query, count: String(count), language: 'en' })
  return `${GEOCODING_URL}?${params.toString()}`
}

function withTimeout(signal: AbortSignal | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

async function requestJson(url: string, options: RequestOptions): Promise<unknown> {
  const doFetch = options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))

  let response: Response
  try {
    response = await doFetch(url, { signal: withTimeout(options.signal) })
  } catch (error) {
    // Caller-initiated cancellation is not a failure; let it propagate untouched.
    if (options.signal?.aborted || isAbortError(error)) throw error
    throw new WeatherApiError('network', 'Network request failed', { cause: error })
  }

  if (!response.ok) {
    const { status } = response
    if (status === 429) throw new WeatherApiError('rate-limit', 'Rate limited', { status })
    if (status >= 500) throw new WeatherApiError('server', `Server error ${status}`, { status })
    throw new WeatherApiError('bad-request', `Request rejected (${status})`, { status })
  }

  try {
    return await response.json()
  } catch (error) {
    throw new WeatherApiError('invalid-response', 'Response was not valid JSON', { cause: error })
  }
}

export function parseGeocodingResponse(json: unknown): GeocodingResponse {
  const parsed = geocodingResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new WeatherApiError('invalid-response', 'Unexpected geocoding response', {
      cause: parsed.error,
    })
  }
  return parsed.data
}

export function parseForecastResponse(json: unknown): ForecastResponse {
  const parsed = forecastResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new WeatherApiError('invalid-response', 'Unexpected forecast response', {
      cause: parsed.error,
    })
  }
  return parsed.data
}

export async function fetchGeocoding(
  query: string,
  count: number,
  options: RequestOptions = {},
): Promise<GeocodingResponse> {
  return parseGeocodingResponse(await requestJson(buildGeocodingUrl(query, count), options))
}

export async function fetchForecast(
  location: Pick<Location, 'latitude' | 'longitude'>,
  options: RequestOptions = {},
): Promise<ForecastResponse> {
  const url = buildForecastUrl(location.latitude, location.longitude)
  return parseForecastResponse(await requestJson(url, options))
}
