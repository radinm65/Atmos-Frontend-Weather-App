import { useContext } from 'react'
import { SavedLocationsContext } from './SavedLocationsContext'
import type { SavedLocationsContextValue } from './SavedLocationsContext'

export function useSavedLocations(): SavedLocationsContextValue {
  const context = useContext(SavedLocationsContext)
  if (!context) throw new Error('useSavedLocations must be used within a SavedLocationsProvider')
  return context
}
