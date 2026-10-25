import { z } from 'zod'
import { WeatherApiError, isAbortError } from '../../lib/api'

/**
 * RainViewer past-radar client (D-08). Terms read from rainviewer.com/api.html on 2026-10-25: the
 * free API is for personal and educational use, a link to rainviewer.com is requested, there is no
 * SLA, and the free tier is limited to zoom 7 and 100 requests per IP per minute. Not for
 * commercial or high-volume use. Only past radar exists (about two hours, 10-minute steps).
 */

const MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json'
const REQUEST_TIMEOUT_MS = 10_000

/** Highest zoom the free tier serves. Leaflet scales the last tile up beyond this. */
export const RADAR_MAX_TILE_ZOOM = 7
/** 512px tiles need a quarter of the requests of 256px tiles, which matters at 100 per minute. */
export const RADAR_TILE_SIZE = 512
export const RADAR_ATTRIBUTION =
  'Radar by <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>'

const frameSchema = z.object({
  time: z.number().int().positive(),
  // A path under the tile host. Providers change these identifiers, so only the shape is checked.
  path: z.string().regex(/^\/[A-Za-z0-9/_-]+$/),
})

const mapsSchema = z.object({
  generated: z.number().int().positive(),
  host: z
    .url({ protocol: /^https$/ })
    .refine((host) => new URL(host).hostname.endsWith('.rainviewer.com'), 'Unexpected tile host'),
  radar: z.object({ past: z.array(frameSchema) }),
})

export interface RadarFrame {
  /** Observation time as an ISO instant. */
  time: string
  path: string
}

export interface RadarTimeline {
  generatedAt: string
  host: string
  /** Oldest first. */
  frames: RadarFrame[]
}

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString()

export function parseRadarTimeline(json: unknown): RadarTimeline {
  const parsed = mapsSchema.safeParse(json)
  if (!parsed.success) {
    throw new WeatherApiError('invalid-response', 'Unexpected radar response', {
      cause: parsed.error,
    })
  }
  const frames = parsed.data.radar.past
    .map((frame) => ({ time: toIso(frame.time), path: frame.path }))
    .sort((a, b) => a.time.localeCompare(b.time))
  if (frames.length === 0) {
    throw new WeatherApiError('not-available', 'The radar service has no frames right now')
  }
  return { generatedAt: toIso(parsed.data.generated), host: parsed.data.host, frames }
}

export interface RadarRequestOptions {
  signal?: AbortSignal
  /** Injectable for tests. */
  fetchImpl?: typeof fetch
}

export async function fetchRadarTimeline(
  options: RadarRequestOptions = {},
): Promise<RadarTimeline> {
  const doFetch = options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout

  let response: Response
  try {
    response = await doFetch(MAPS_URL, { signal })
  } catch (error) {
    if (options.signal?.aborted || isAbortError(error)) throw error
    throw new WeatherApiError('network', 'Radar request failed', { cause: error })
  }
  if (!response.ok) {
    const { status } = response
    throw new WeatherApiError(
      status === 429 ? 'rate-limit' : status >= 500 ? 'server' : 'bad-request',
      `Radar request failed (${status})`,
      { status },
    )
  }
  let json: unknown
  try {
    json = await response.json()
  } catch (error) {
    throw new WeatherApiError('invalid-response', 'Radar response was not valid JSON', {
      cause: error,
    })
  }
  return parseRadarTimeline(json)
}

/**
 * Leaflet tile URL for one frame. Colour scheme 2 is "Universal Blue", the only one left on the
 * free tier; `1_1` turns on smoothing and snow colouring.
 */
export function radarTileUrl(timeline: Pick<RadarTimeline, 'host'>, frame: RadarFrame): string {
  return `${timeline.host}${frame.path}/${RADAR_TILE_SIZE}/{z}/{x}/{y}/2/1_1.png`
}

/** The frame to show: the chosen one if it still exists, otherwise the newest. */
export function pickFrame(
  frames: readonly RadarFrame[],
  chosenTime: string | null,
): RadarFrame | null {
  return (
    (chosenTime ? frames.find((frame) => frame.time === chosenTime) : undefined) ??
    frames.at(-1) ??
    null
  )
}

/** How many of the newest frames playback loops over (keeps requests under the rate limit). */
export const PLAYBACK_FRAMES = 6

/** The next frame to show while playing, looping over the newest `PLAYBACK_FRAMES`. */
export function nextPlaybackFrame(
  frames: readonly RadarFrame[],
  currentTime: string | null,
): RadarFrame | null {
  const window = frames.slice(-PLAYBACK_FRAMES)
  if (window.length === 0) return null
  const index = window.findIndex((frame) => frame.time === currentTime)
  return window[(index + 1) % window.length] ?? null
}
