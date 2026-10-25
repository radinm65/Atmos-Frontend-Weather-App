import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Location } from '../../domain/location'
import { SavedLocationsContext } from './SavedLocationsContext'
import type { SavedLocationsContextValue } from './SavedLocationsContext'
import {
  MAX_SAVED_LOCATIONS,
  loadSavedLocations,
  writeSavedLocations,
} from './savedLocationsStorage'

/** The user's saved places, kept in this browser's local storage (no account, no sync). */
export function SavedLocationsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<readonly Location[]>(loadSavedLocations)

  const isSaved = useCallback((id: string) => saved.some((place) => place.id === id), [saved])

  const save = useCallback(
    (location: Location): boolean => {
      if (saved.some((place) => place.id === location.id)) return true
      if (saved.length >= MAX_SAVED_LOCATIONS) return false
      const next = [...saved, location]
      setSaved(next)
      writeSavedLocations(next)
      return true
    },
    [saved],
  )

  const remove = useCallback(
    (id: string) => {
      const next = saved.filter((place) => place.id !== id)
      setSaved(next)
      writeSavedLocations(next)
    },
    [saved],
  )

  const value = useMemo<SavedLocationsContextValue>(
    () => ({ saved, maxSaved: MAX_SAVED_LOCATIONS, isSaved, save, remove }),
    [saved, isSaved, save, remove],
  )

  return <SavedLocationsContext.Provider value={value}>{children}</SavedLocationsContext.Provider>
}
