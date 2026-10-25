import type { Location } from '../../domain/location'
import { isLocation } from '../../lib/schemas/locationSchema'
import { readStorageList, storageKey, writeStorage } from '../../lib/storage'

/** Bump the version if the stored `Location` shape changes incompatibly. */
export const SAVED_LOCATIONS_KEY = storageKey('saved-locations', 1)

/** A generous cap that keeps the Locations page (one forecast request per city) light. */
export const MAX_SAVED_LOCATIONS = 12

/**
 * Saved places from this browser. Corrupted entries are dropped one by one (the rest survive),
 * duplicates are removed, and anything that is not a list gives an empty list.
 */
export function loadSavedLocations(): Location[] {
  return readStorageList(SAVED_LOCATIONS_KEY, isLocation, {
    max: MAX_SAVED_LOCATIONS,
    keyOf: (location) => location.id,
  })
}

export function writeSavedLocations(locations: readonly Location[]): void {
  writeStorage(SAVED_LOCATIONS_KEY, locations)
}
