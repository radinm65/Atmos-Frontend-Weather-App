import type { Location } from '../../../domain/location'
import type { WeatherDataSource } from '../dataSource'
import { WeatherApiError, isAbortError } from '../errors'
import { parseForecastResponse } from '../openMeteo/client'
import { normalizeForecast } from '../openMeteo/normalize'
import { manifestSchema, snapshotFileSchema } from './format'

/**
 * Recorded snapshots of real Open-Meteo responses, served as static files (OPEN_DECISIONS D-18,
 * TRD §4a). Raw provider payloads are stored and pass through the same validation and
 * normalization as live data. Every report carries `source.kind === 'snapshot'` and the capture
 * time, so the UI can say plainly that this is recorded data and not current conditions.
 * The file format lives in ./format.ts and is written by scripts/record-snapshots.mjs.
 */

export interface SnapshotSourceOptions {
  /** Directory the snapshot files are served from, with a trailing slash. */
  baseUrl?: string
  fetchImpl?: typeof fetch
}

export function createSnapshotSource(options: SnapshotSourceOptions = {}): WeatherDataSource {
  const baseUrl = options.baseUrl ?? `${import.meta.env.BASE_URL}snapshots/`
  const doFetch = options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))

  async function loadJson(file: string, signal: AbortSignal | undefined): Promise<unknown> {
    let response: Response
    try {
      response = await doFetch(`${baseUrl}${file}`, { signal })
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) throw error
      throw new WeatherApiError('network', 'Could not load snapshot data', { cause: error })
    }
    if (response.status === 404) {
      throw new WeatherApiError('not-available', `Snapshot file not found: ${file}`, {
        status: 404,
      })
    }
    if (!response.ok) {
      throw new WeatherApiError('server', `Snapshot request failed (${response.status})`, {
        status: response.status,
      })
    }
    try {
      return await response.json()
    } catch (error) {
      throw new WeatherApiError('invalid-response', 'Snapshot file was not valid JSON', {
        cause: error,
      })
    }
  }

  async function loadManifest(signal: AbortSignal | undefined) {
    const parsed = manifestSchema.safeParse(await loadJson('manifest.json', signal))
    if (!parsed.success) {
      throw new WeatherApiError('invalid-response', 'Unexpected snapshot manifest', {
        cause: parsed.error,
      })
    }
    return parsed.data
  }

  return {
    kind: 'snapshot',

    /** Only recorded places can be found in snapshot mode. */
    async searchLocations(query, context) {
      const manifest = await loadManifest(context?.signal)
      const needle = query.trim().toLowerCase()
      return manifest.locations
        .map((entry) => entry.location)
        .filter((location) => location.name.toLowerCase().includes(needle))
    },

    /** Air quality is not part of the recorded snapshots. */
    getAirQuality(location: Location) {
      return Promise.reject(
        new WeatherApiError('not-available', `No recorded air quality for ${location.id}`),
      )
    },

    async getWeather(location: Location, context) {
      const manifest = await loadManifest(context?.signal)
      const entry = manifest.locations.find((candidate) => candidate.location.id === location.id)
      if (!entry) {
        throw new WeatherApiError('not-available', `No snapshot recorded for ${location.id}`)
      }

      const parsed = snapshotFileSchema.safeParse(await loadJson(entry.file, context?.signal))
      if (!parsed.success) {
        throw new WeatherApiError('invalid-response', 'Unexpected snapshot file', {
          cause: parsed.error,
        })
      }

      const { capturedAt } = parsed.data
      return normalizeForecast(
        parseForecastResponse(parsed.data.forecast),
        parsed.data.location,
        { kind: 'snapshot', capturedAt },
        capturedAt,
      )
    },
  }
}
