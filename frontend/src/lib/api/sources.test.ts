import { describe, expect, it, vi } from 'vitest'
import { createDataSource } from './index'
import { createLiveSource } from './openMeteo/liveSource'
import {
  airQualityFixture,
  berlin,
  forecastFixture,
  geocodingFixture,
} from './openMeteo/testFixtures'
import { createSnapshotSource } from './snapshot/snapshotSource'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('live source', () => {
  it('searches and returns normalized locations', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json(geocodingFixture()))
    const results = await createLiveSource(fetchImpl).searchLocations('Berlin')
    expect(results.map((place) => place.id)).toEqual(['om:2950159', 'om:5083330'])
  })

  it('returns a live report stamped with the fetch time', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json(forecastFixture()))
    const report = await createLiveSource(fetchImpl).getWeather(berlin)
    expect(report.source).toEqual({ kind: 'live' })
    expect(report.location.id).toBe(berlin.id)
    expect(Number.isNaN(Date.parse(report.fetchedAt))).toBe(false)
  })
})

describe('live source air quality', () => {
  it('returns a live air-quality report from the air-quality endpoint', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(json(airQualityFixture()))
    const report = await createLiveSource(fetchImpl).getAirQuality(berlin)
    expect(report.usAqi).toBe(29)
    expect(report.source).toEqual({ kind: 'live' })
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('air-quality-api.open-meteo.com')
  })
})

describe('snapshot source', () => {
  it('has no recorded air quality, and says so', async () => {
    const error = await createSnapshotSource({ baseUrl: '/snapshots/' })
      .getAirQuality(berlin)
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'not-available' })
  })
})

describe('snapshot source files', () => {
  const capturedAt = '2026-10-24T16:05:00.000Z'
  const manifest = {
    version: 1,
    capturedAt,
    locations: [{ location: berlin, file: 'om-2950159.json' }],
  }
  const snapshotFile = {
    version: 1,
    capturedAt,
    location: berlin,
    forecast: forecastFixture(),
  }

  function fetchFiles(files: Record<string, unknown>) {
    return vi.fn<typeof fetch>().mockImplementation((input) => {
      const name = String(input).split('/').pop() ?? ''
      return Promise.resolve(name in files ? json(files[name]) : new Response('', { status: 404 }))
    })
  }

  const source = (files: Record<string, unknown>) =>
    createSnapshotSource({ baseUrl: '/snapshots/', fetchImpl: fetchFiles(files) })

  it('only finds recorded places', async () => {
    const results = await source({ 'manifest.json': manifest }).searchLocations('ber')
    expect(results.map((place) => place.name)).toEqual(['Berlin'])
    expect(await source({ 'manifest.json': manifest }).searchLocations('paris')).toEqual([])
  })

  it('reports recorded data as a snapshot with its capture time, never as live', async () => {
    const report = await source({
      'manifest.json': manifest,
      'om-2950159.json': snapshotFile,
    }).getWeather(berlin)
    expect(report.source).toEqual({ kind: 'snapshot', capturedAt })
    expect(report.fetchedAt).toBe(capturedAt)
    expect(report.current.temperature).toBe(9.4)
    expect(report.timezone).toBe('Europe/Berlin')
  })

  it('says "not available" for a place that was not recorded', async () => {
    const error = await source({ 'manifest.json': manifest })
      .getWeather({ ...berlin, id: 'om:1' })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'not-available' })
  })

  it('says "not available" when the snapshot file is missing', async () => {
    const error = await source({ 'manifest.json': manifest })
      .getWeather(berlin)
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'not-available' })
  })

  it('rejects a malformed manifest or snapshot', async () => {
    const badManifest = await source({ 'manifest.json': { version: 99 } })
      .searchLocations('ber')
      .catch((e: unknown) => e)
    expect(badManifest).toMatchObject({ kind: 'invalid-response' })

    const badFile = await source({
      'manifest.json': manifest,
      'om-2950159.json': { ...snapshotFile, forecast: { nope: true } },
    })
      .getWeather(berlin)
      .catch((e: unknown) => e)
    expect(badFile).toMatchObject({ kind: 'invalid-response' })
  })
})

describe('createDataSource', () => {
  it('selects the implementation from configuration', () => {
    expect(createDataSource({ dataSource: 'live' }).kind).toBe('live')
    expect(createDataSource({ dataSource: 'snapshot' }).kind).toBe('snapshot')
  })
})
