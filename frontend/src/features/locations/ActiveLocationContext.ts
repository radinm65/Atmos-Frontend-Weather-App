import { createContext } from 'react'
import type { Location } from '../../domain/location'

export interface ActiveLocationContextValue {
  /** The place every page shows. `null` until the user picks one (first-run state, D-09). */
  activeLocation: Location | null
  setActiveLocation: (location: Location) => void
  clearActiveLocation: () => void
}

export const ActiveLocationContext = createContext<ActiveLocationContextValue | null>(null)
