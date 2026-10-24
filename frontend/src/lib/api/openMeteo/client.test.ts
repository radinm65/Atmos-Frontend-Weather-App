import { describe, expect, it, vi } from 'vitest'
import { WeatherApiError, describeError } from '../errors'
import {
  FORECAST_DAYS,
  buildForecastUrl,
  buildGeocodingUrl,
  fetchForecast,
  fetchGeocoding,
} from './client'
import { berlin, forecastFixture, geocodingFixture } from './testFixtures'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchReturning = (response: Response) => vi.fn<typeof fetch>().mockResolvedValue(response)

describe('URL builders', () => {
  it('requests location time zone, unix times and the configured horizon', () => {
    const url = new URL(buildForecastUrl(52.5, 13.4))
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast')
    expect(url.searchParams.get('latitude')).toBe('52.5')
    expect(url.searchParams.get('longitude')).toBe('13.4')
    expect(url.searchParams.get('timezone')).toBe('auto')
    expect(url.searchParams.get('timeformat')).toBe('unixtime')
    expect(url.searchParams.get('forecast_days')).toBe(String(FORECAST_DAYS))
    expect(url.searchParams.get('current')).toContain('temperature_2m')
  })

  it('does not request imperial units', () => {
    const url = new URL(buildForecastUrl(1, 2))
    expect(url.searchParams.has('temperature_unit')).toBe(false)
    expect(url.searchParams.has('wind_speed_unit')).toBe(false)
  })

  it('encodes the geocoding query', () => {
    const url = new URL(buildGeocodingUrl('São Paulo & co', 8))
    expect(url.searchParams.get('name')).toBe('São Paulo & co')
    expect(url.searchParams.get('count')).toBe('8')
  })
})

describe('fetchGeocoding / fetchForecast', () => {
  it('returns validated geocoding data', async () => {
    const fetchImpl = fetchReturning(jsonResponse(geocodingFixture()))
    const result = await fetchGeocoding('Berlin', 8, { fetchImpl })
    expect(result.results).toHaveLength(2)
    expect(fetchImpl).toHaveBeenCalledOnce()
  })

  it('returns validated forecast data', async () => {
    const fetchImpl = fetchReturning(jsonResponse(forecastFixture()))
    const result = await fetchForecast(berlin, { fetchImpl })
    expect(result.timezone).toBe('Europe/Berlin')
  })

  it('maps HTTP 429 to a rate-limit error that is not auto-retried', async () => {
    const error = await fetchForecast(berlin, {
      fetchImpl: fetchReturning(jsonResponse({}, 429)),
    }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(WeatherApiError)
    expect(error).toMatchObject({ kind: 'rate-limit', status: 429, retryable: false })
  })

  it('maps HTTP 5xx to a retryable server error', async () => {
    const error = await fetchForecast(berlin, {
      fetchImpl: fetchReturning(jsonResponse({}, 503)),
    }).catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'server', retryable: true })
  })

  it('maps other 4xx to a bad-request error', async () => {
    const error = await fetchForecast(berlin, {
      fetchImpl: fetchReturning(jsonResponse({ error: true, reason: 'bad' }, 400)),
    }).catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'bad-request', retryable: false })
  })

  it('maps a failed fetch to a retryable network error', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await fetchGeocoding('Berlin', 8, { fetchImpl }).catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'network', retryable: true })
  })

  it('maps a body that is not JSON to an invalid-response error', async () => {
    const fetchImpl = fetchReturning(new Response('<html>oops</html>', { status: 200 }))
    const error = await fetchForecast(berlin, { fetchImpl }).catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'invalid-response', retryable: false })
  })

  it('maps JSON of the wrong shape to an invalid-response error', async () => {
    const fetchImpl = fetchReturning(jsonResponse({ hello: 'world' }))
    const error = await fetchForecast(berlin, { fetchImpl }).catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'invalid-response' })
  })

  it('lets caller cancellation propagate instead of reporting a failure', async () => {
    const controller = new AbortController()
    const abort = new DOMException('Aborted', 'AbortError')
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() => {
      controller.abort()
      return Promise.reject(abort)
    })
    const error = await fetchGeocoding('Berlin', 8, {
      fetchImpl,
      signal: controller.signal,
    }).catch((e: unknown) => e)
    expect(error).toBe(abort)
  })
})

describe('describeError', () => {
  it('gives actionable text for each error kind', () => {
    const kinds = [
      'network',
      'rate-limit',
      'server',
      'bad-request',
      'invalid-response',
      'not-available',
    ] as const
    for (const kind of kinds) {
      const { title, message } = describeError(new WeatherApiError(kind, 'internal detail'))
      expect(title.length).toBeGreaterThan(0)
      expect(message).not.toContain('internal detail')
    }
  })

  it('handles unknown thrown values', () => {
    expect(describeError('boom').title).toBe('Something went wrong')
  })
})
