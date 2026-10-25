import { useContext } from 'react'
import { PreferencesContext } from './PreferencesContext'
import type { PreferencesContextValue } from './PreferencesContext'

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences must be used within a PreferencesProvider')
  return context
}
