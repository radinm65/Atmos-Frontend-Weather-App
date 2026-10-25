/// <reference types="node" />
// This test reads the recorded files from disk, so it (and only it) needs Node's types.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSnapshotSource } from './snapshotSource'

/**
 * Integrity check on the real recorded files in public/snapshots (written by
 * `npm run snapshots:record`). If a recording is malformed or stale in format, this fails the
 * build instead of breaking snapshot mode in production.
 */
const dir = path.resolve(process.cwd(), 'public/snapshots')

const fileFetch: typeof fetch = async (input) => {
  const name = String(input).split('/').pop() ?? ''
  try {
    return new Response(await readFile(path.join(dir, name), 'utf8'), { status: 200 })
  } catch {
    return new Response('', { status: 404 })
  }
}

const source = createSnapshotSource({ baseUrl: '/snapshots/', fetchImpl: fileFetch })

describe('recorded snapshots (public/snapshots)', () => {
  it('lists a curated set of cities and finds them by name', async () => {
    const all = await source.searchLocations('')
    expect(all.length).toBeGreaterThanOrEqual(10)
    expect((await source.searchLocations('tokyo')).map((place) => place.name)).toEqual(['Tokyo'])
    expect(await source.searchLocations('atlantis')).toEqual([])
  })

  it('reads every recorded city through the normal validation, labelled as a snapshot', async () => {
    const places = await source.searchLocations('')
    for (const place of places) {
      const report = await source.getWeather(place)
      expect(report.source.kind).toBe('snapshot')
      expect(report.source.capturedAt).toBeTruthy()
      expect(report.location.id).toBe(place.id)
      expect(report.timezone).toMatch(/\//) // an IANA zone such as Asia/Tokyo
      expect(report.hourly.length).toBeGreaterThan(24)
      expect(report.daily.length).toBeGreaterThanOrEqual(7)
      expect(report.current.condition.label.length).toBeGreaterThan(0)
      // Real recordings include sun times for the sky/sun widgets.
      expect(report.daily[0]?.sunrise ?? report.daily[0]?.sunset ?? null).not.toBeUndefined()
    }
  })

  it('does not offer cities that were not recorded', async () => {
    const error = await source
      .getWeather({ id: 'om:1', name: 'Nowhere', latitude: 0, longitude: 0 })
      .catch((e: unknown) => e)
    expect(error).toMatchObject({ kind: 'not-available' })
  })
})
