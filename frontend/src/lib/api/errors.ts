export type WeatherApiErrorKind =
  /** Could not reach the service (offline, DNS, CORS, timeout). */
  | 'network'
  /** The provider's rate limit was hit (HTTP 429). */
  | 'rate-limit'
  /** The provider failed (HTTP 5xx). */
  | 'server'
  /** The provider rejected the request (other 4xx). */
  | 'bad-request'
  /** The response did not match the shape we expect. */
  | 'invalid-response'
  /** The selected data source has no data for this request (e.g. a city that was not recorded). */
  | 'not-available'

const RETRYABLE: ReadonlySet<WeatherApiErrorKind> = new Set(['network', 'server'])

export class WeatherApiError extends Error {
  readonly kind: WeatherApiErrorKind
  readonly status: number | undefined

  constructor(
    kind: WeatherApiErrorKind,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'WeatherApiError'
    this.kind = kind
    this.status = options.status
  }

  /** Whether trying the same request again soon is likely to help. */
  get retryable(): boolean {
    return RETRYABLE.has(this.kind)
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export interface ErrorDescription {
  title: string
  message: string
}

/** Turns any thrown value into text a person can act on. Never exposes raw provider payloads. */
export function describeError(error: unknown): ErrorDescription {
  if (error instanceof WeatherApiError) {
    switch (error.kind) {
      case 'network':
        return {
          title: "Can't reach the weather service",
          message: 'Check your internet connection and try again.',
        }
      case 'rate-limit':
        return {
          title: 'Too many requests',
          message:
            'The weather service is limiting requests right now. Wait a minute and try again.',
        }
      case 'server':
        return {
          title: 'Weather service problem',
          message: 'The weather service had a problem. Try again in a moment.',
        }
      case 'bad-request':
        return {
          title: "That request didn't work",
          message: 'The weather service rejected the request. Try a different location.',
        }
      case 'invalid-response':
        return {
          title: 'Unexpected weather data',
          message: 'The weather service sent data Atmos could not read. Try again later.',
        }
      case 'not-available':
        return {
          title: 'No data for this place',
          message: 'This place has no recorded weather data in the current data mode.',
        }
    }
  }
  return {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Try again.',
  }
}
