import { createContext } from 'react'
import type { Location } from '../../domain/location'

export interface SavedLocationsContextValue {
  saved: readonly Location[]
  maxSaved: number
  isSaved: (id: string) => boolean
  /** Returns `false` (and saves nothing) when the list is full. Saving a saved place is a no-op. */
  save: (location: Location) => boolean
  remove: (id: string) => void
}

export const SavedLocationsContext = createContext<SavedLocationsContextValue | null>(null)
