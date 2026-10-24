import type { Location } from '../../domain/location'
import { readStorage, removeStorage, storageKey, writeStorage } from '../../lib/storage'
import { isLocation } from '../../lib/schemas/locationSchema'

/** Bump the version if the stored `Location` shape changes incompatibly. */
export const ACTIVE_LOCATION_KEY = storageKey('active-location', 1)

/** The saved active location, or `null` when none is saved or the stored value is invalid. */
export function loadActiveLocation(): Location | null {
  return readStorage(ACTIVE_LOCATION_KEY, isLocation)
}

export function saveActiveLocation(location: Location | null): void {
  if (location === null) removeStorage(ACTIVE_LOCATION_KEY)
  else writeStorage(ACTIVE_LOCATION_KEY, location)
}
