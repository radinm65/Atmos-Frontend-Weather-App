import { z } from 'zod'
import type { Location } from '../../../domain/location'
import { locationSchema } from '../../schemas/locationSchema'

/**
 * The on-disk format of recorded snapshots (OPEN_DECISIONS D-18, TRD §4a), shared by the app's
 * snapshot source and the recorder script so a recorded file is always one the app can read.
 *
 * Layout under `<base>snapshots/`:
 *   manifest.json   { version, capturedAt, locations: [{ location, file }] }
 *   <file>.json     { version, capturedAt, location, forecast: <raw provider forecast response> }
 */

export const SNAPSHOT_VERSION = 1

export const manifestSchema = z.object({
  version: z.literal(SNAPSHOT_VERSION),
  capturedAt: z.string(),
  locations: z.array(z.object({ location: locationSchema, file: z.string().min(1) })),
})

export const snapshotFileSchema = z.object({
  version: z.literal(SNAPSHOT_VERSION),
  capturedAt: z.string(),
  location: locationSchema,
  forecast: z.unknown(),
})

export type SnapshotManifest = z.infer<typeof manifestSchema>
export type SnapshotFile = z.infer<typeof snapshotFileSchema>

/** `om:2950159` -> `om-2950159.json`: a safe file name for any location id. */
export function snapshotFileName(locationId: string): string {
  return `${locationId.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.json`
}

export function buildSnapshotFile(
  location: Location,
  forecast: unknown,
  capturedAt: string,
): SnapshotFile {
  return { version: SNAPSHOT_VERSION, capturedAt, location, forecast }
}

export function buildManifest(
  locations: readonly Location[],
  capturedAt: string,
): SnapshotManifest {
  return {
    version: SNAPSHOT_VERSION,
    capturedAt,
    locations: locations.map((location) => ({ location, file: snapshotFileName(location.id) })),
  }
}
