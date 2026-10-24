import { QueryClient } from '@tanstack/react-query'
import { WeatherApiError } from '../api'

/** Fresh weather is reused for this long before a background refetch is allowed. */
export const WEATHER_STALE_TIME_MS = 10 * 60 * 1000
/** Place-name lookups barely change. */
export const SEARCH_STALE_TIME_MS = 60 * 60 * 1000

const MAX_RETRIES = 2

/**
 * Retry network and server failures a couple of times with backoff. Rate limits, rejected
 * requests and malformed responses will not improve by hammering the provider, so they fail fast.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false
  return error instanceof WeatherApiError && error.retryable
}

export function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 8000)
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,
        staleTime: WEATHER_STALE_TIME_MS,
        gcTime: 30 * 60 * 1000,
      },
    },
  })
}
