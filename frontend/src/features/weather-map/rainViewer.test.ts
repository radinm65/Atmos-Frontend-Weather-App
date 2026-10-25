import { describe, expect, it, vi } from 'vitest'
import { WeatherApiError } from '../../lib/api'
import { createPinLocation, formatCoordinates, isPin } from './pin'
import {
  PLAYBACK_FRAMES,
  fetchRadarTimeline,
  nextPlaybackFrame,
  parseRadarTimeline,
  pickFrame,
  radarTileUrl,
} from './rainViewer'

const HOST = 'https://tilecache.rainviewer.com'

function payload(count = 3, overrides: Record<string, unknown> = {}) {
  return {
    version: '2.0',
    generated: 1_792_939_823,
    host: HOST,
    radar: {
      past: Array.from({ length: count }, (_, i) => ({
        time: 1_792_932_600 + i * 600,
        path: `/v2/radar/hash${i}`,
      })),
      nowcast: [],
    },
    ...overrides,
  }
}

describe('parseRadarTimeline', () => {
  it('returns frames oldest first with ISO times', () => {
    const body = payload(3)
    body.radar.past.reverse()
    const timeline = parseRadarTimeline(body)
    expect(timeline.frames.map((frame) => frame.path)).toEqual([
      '/v2/radar/hash0',
      '/v2/radar/hash1',
      '/v2/radar/hash2',
    ])
    expect(timeline.frames[0]?.time).toBe(new Date(1_792_932_600 * 1000).toISOString())
    expect(timeline.host).toBe(HOST)
  })

  it('rejects payloads of the wrong shape', () => {
    for (const bad of [null, {}, payload(2, { radar: {} }), payload(2, { generated: 'now' })]) {
      expect(() => parseRadarTimeline(bad)).toThrow(WeatherApiError)
    }
  })

  it('rejects a tile host that is not a RainViewer https host', () => {
    for (const host of [
      'http://tilecache.rainviewer.com',
      'https://evil.example.com',
      'https://rainviewer.com.evil.example',
    ]) {
      expect(() => parseRadarTimeline(payload(1, { host }))).toThrow(WeatherApiError)
    }
  })

  it('rejects frame paths that could escape the tile host', () => {
    const body = payload(1)
    body.radar.past[0] = { time: 1_792_932_600, path: '//evil.example/x' }
    expect(() => parseRadarTimeline(body)).toThrow(WeatherApiError)
  })

  it('reports "not available" when there are no frames', () => {
    expect(() => parseRadarTimeline(payload(0))).toThrowError(
      expect.objectContaining({ kind: 'not-available' }),
    )
  })
})

describe('radarTileUrl', () => {
  it('builds a Leaflet template for 512px tiles with the free-tier colour scheme', () => {
    const [frame] = parseRadarTimeline(payload(1)).frames
    expect(radarTileUrl({ host: HOST }, frame!)).toBe(
      `${HOST}/v2/radar/hash0/512/{z}/{x}/{y}/2/1_1.png`,
    )
  })
})

describe('frame selection and playback', () => {
  const frames = parseRadarTimeline(payload(10)).frames

  it('shows the newest frame unless a still-existing one was chosen', () => {
    expect(pickFrame(frames, null)).toBe(frames.at(-1))
    expect(pickFrame(frames, frames[2]!.time)).toBe(frames[2])
    expect(pickFrame(frames, '1999-01-01T00:00:00.000Z')).toBe(frames.at(-1))
    expect(pickFrame([], null)).toBeNull()
  })

  it('loops over only the newest frames, to stay inside the request limit', () => {
    const seen: string[] = []
    let current: string | null = frames.at(-1)!.time
    for (let step = 0; step < PLAYBACK_FRAMES + 2; step += 1) {
      current = nextPlaybackFrame(frames, current)!.time
      seen.push(current)
    }
    expect(new Set(seen).size).toBe(PLAYBACK_FRAMES)
    const oldestAllowed = frames[frames.length - PLAYBACK_FRAMES]!.time
    expect(seen.every((time) => time >= oldestAllowed)).toBe(true)
  })

  it('starts at the beginning of the window from an unknown frame, and handles no frames', () => {
    expect(nextPlaybackFrame(frames, null)).toBe(frames[frames.length - PLAYBACK_FRAMES])
    expect(nextPlaybackFrame([], null)).toBeNull()
  })
})

describe('fetchRadarTimeline', () => {
  const json = (body: unknown, status = 200) =>
    vi.fn<typeof fetch>(() => Promise.resolve(new Response(JSON.stringify(body), { status })))

  it('fetches and parses the timeline', async () => {
    const fetchImpl = json(payload(2))
    const timeline = await fetchRadarTimeline({ fetchImpl })
    expect(timeline.frames).toHaveLength(2)
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      'https://api.rainviewer.com/public/weather-maps.json',
    )
  })

  it.each([
    [429, 'rate-limit'],
    [503, 'server'],
    [404, 'bad-request'],
  ])('maps HTTP %i to %s', async (status, kind) => {
    await expect(fetchRadarTimeline({ fetchImpl: json({}, status) })).rejects.toMatchObject({
      kind,
    })
  })

  it('maps a network failure and unreadable JSON', async () => {
    await expect(
      fetchRadarTimeline({ fetchImpl: () => Promise.reject(new TypeError('offline')) }),
    ).rejects.toMatchObject({ kind: 'network' })
    await expect(
      fetchRadarTimeline({ fetchImpl: () => Promise.resolve(new Response('<html>')) }),
    ).rejects.toMatchObject({ kind: 'invalid-response' })
  })
})

describe('pins', () => {
  it('names a tapped point by its coordinates and rounds it', () => {
    const pin = createPinLocation(52.520_08, 13.404_95)
    expect(pin).toMatchObject({ id: 'pin:52.52,13.405', latitude: 52.52, longitude: 13.405 })
    expect(pin.name).toBe('Pin at 52.52° N, 13.40° E')
    expect(isPin(pin)).toBe(true)
  })

  it('keeps coordinates valid after panning around the world', () => {
    expect(createPinLocation(95, 190)).toMatchObject({ latitude: 90, longitude: -170 })
    expect(createPinLocation(-95, -190)).toMatchObject({ latitude: -90, longitude: 170 })
    expect(formatCoordinates(-33.87, -70.5)).toBe('33.87° S, 70.50° W')
  })
})
