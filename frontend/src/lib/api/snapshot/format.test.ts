import { describe, expect, it } from 'vitest'
import { berlin, forecastFixture } from '../openMeteo/testFixtures'
import {
  SNAPSHOT_VERSION,
  buildManifest,
  buildSnapshotFile,
  manifestSchema,
  snapshotFileName,
  snapshotFileSchema,
} from './format'

describe('snapshotFileName', () => {
  it('turns a location id into a safe file name', () => {
    expect(snapshotFileName('om:2950159')).toBe('om-2950159.json')
    expect(snapshotFileName('geo:52.52,13.41')).toBe('geo-52-52-13-41.json')
    expect(snapshotFileName('../../etc/passwd')).toBe('etc-passwd.json')
  })

  it('never produces a path separator', () => {
    for (const id of ['a/b', 'a\\b', 'a:b', '..', 'a b']) {
      expect(snapshotFileName(id)).not.toMatch(/[\\/:]/)
    }
  })
})

describe('buildSnapshotFile / buildManifest', () => {
  const capturedAt = '2026-10-25T13:50:24.656Z'

  it('builds files that pass the schema the app reads them with', () => {
    const file = buildSnapshotFile(berlin, forecastFixture(), capturedAt)
    expect(file.version).toBe(SNAPSHOT_VERSION)
    expect(snapshotFileSchema.parse(file).location.id).toBe('om:2950159')
  })

  it('builds a manifest whose file names match the recorded files', () => {
    const manifest = buildManifest([berlin], capturedAt)
    expect(manifestSchema.parse(manifest).locations[0]).toEqual({
      location: berlin,
      file: snapshotFileName(berlin.id),
    })
  })

  it('rejects an unknown version, so an old or future format is never misread', () => {
    const manifest = { ...buildManifest([berlin], capturedAt), version: 99 }
    expect(manifestSchema.safeParse(manifest).success).toBe(false)
  })
})
