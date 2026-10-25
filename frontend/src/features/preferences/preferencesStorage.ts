import { z } from 'zod'
import { DEFAULT_UNITS } from '../../lib/formatting'
import type { UnitPreferences } from '../../lib/formatting'
import { readStorageParsed, storageKey, writeStorage } from '../../lib/storage'

/** Bump the version if the stored shape changes incompatibly; old data is then simply ignored. */
export const PREFERENCES_KEY = storageKey('preferences', 1)

// Each field falls back to its default on its own, so one bad value never resets the others.
const preferencesSchema = z
  .object({
    units: z
      .object({
        temperature: z.enum(['c', 'f']).catch(DEFAULT_UNITS.temperature),
        windSpeed: z.enum(['kmh', 'mph']).catch(DEFAULT_UNITS.windSpeed),
      })
      .catch(DEFAULT_UNITS),
  })
  .catch({ units: DEFAULT_UNITS })

export function loadUnits(): UnitPreferences {
  return (
    readStorageParsed(PREFERENCES_KEY, (value) => preferencesSchema.parse(value).units) ??
    DEFAULT_UNITS
  )
}

export function saveUnits(units: UnitPreferences): void {
  writeStorage(PREFERENCES_KEY, { units })
}
