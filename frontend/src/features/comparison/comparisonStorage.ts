import type { Location } from '../../domain/location'
import { isLocation } from '../../lib/schemas/locationSchema'
import { readStorageList, storageKey, writeStorage } from '../../lib/storage'

/** Bump the version if the stored `Location` shape changes incompatibly. */
export const COMPARISON_KEY = storageKey('comparison', 1)

/** Comparison limits (OPEN_DECISIONS D-16): at least 2 cities to compare, at most 4. */
export const MIN_COMPARED = 2
export const MAX_COMPARED = 4

/** The cities chosen for comparison, with corrupted or duplicate entries dropped. */
export function loadComparison(): Location[] {
  return readStorageList(COMPARISON_KEY, isLocation, {
    max: MAX_COMPARED,
    keyOf: (location) => location.id,
  })
}

export function writeComparison(locations: readonly Location[]): void {
  writeStorage(COMPARISON_KEY, locations)
}
