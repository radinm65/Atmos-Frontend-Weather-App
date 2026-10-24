import { useContext } from 'react'
import { ActiveLocationContext } from './ActiveLocationContext'
import type { ActiveLocationContextValue } from './ActiveLocationContext'

export function useActiveLocation(): ActiveLocationContextValue {
  const context = useContext(ActiveLocationContext)
  if (!context) throw new Error('useActiveLocation must be used within an ActiveLocationProvider')
  return context
}
