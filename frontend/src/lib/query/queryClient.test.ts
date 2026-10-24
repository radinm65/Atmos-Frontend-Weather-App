import { describe, expect, it } from 'vitest'
import { WeatherApiError } from '../api'
import { queryKeys } from './keys'
import { retryDelay, shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('retries network and server errors up to twice', () => {
    const network = new WeatherApiError('network', 'x')
    const server = new WeatherApiError('server', 'x')
    expect(shouldRetry(0, network)).toBe(true)
    expect(shouldRetry(1, server)).toBe(true)
    expect(shouldRetry(2, network)).toBe(false)
  })

  it('does not retry rate limits, bad requests, bad data or unknown errors', () => {
    for (const kind of [
      'rate-limit',
      'bad-request',
      'invalid-response',
      'not-available',
    ] as const) {
      expect(shouldRetry(0, new WeatherApiError(kind, 'x'))).toBe(false)
    }
    expect(shouldRetry(0, new Error('boom'))).toBe(false)
  })
})

describe('retryDelay', () => {
  it('backs off exponentially with a cap', () => {
    expect(retryDelay(0)).toBe(1000)
    expect(retryDelay(1)).toBe(2000)
    expect(retryDelay(10)).toBe(8000)
  })
})

describe('queryKeys', () => {
  it('separates live and snapshot data', () => {
    expect(queryKeys.weather('live', 'om:1')).not.toEqual(queryKeys.weather('snapshot', 'om:1'))
  })

  it('normalizes search text', () => {
    expect(queryKeys.locationSearch('live', '  Berlin ')).toEqual(
      queryKeys.locationSearch('live', 'berlin'),
    )
  })
})
