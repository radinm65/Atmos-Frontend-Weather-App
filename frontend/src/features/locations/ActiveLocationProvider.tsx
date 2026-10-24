import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Location } from '../../domain/location'
import { ActiveLocationContext } from './ActiveLocationContext'
import type { ActiveLocationContextValue } from './ActiveLocationContext'
import { loadActiveLocation, saveActiveLocation } from './activeLocationStorage'

export function ActiveLocationProvider({ children }: { children: ReactNode }) {
  const [activeLocation, setState] = useState<Location | null>(loadActiveLocation)

  const setActiveLocation = useCallback((location: Location) => {
    setState(location)
    saveActiveLocation(location)
  }, [])

  const clearActiveLocation = useCallback(() => {
    setState(null)
    saveActiveLocation(null)
  }, [])

  const value = useMemo<ActiveLocationContextValue>(
    () => ({ activeLocation, setActiveLocation, clearActiveLocation }),
    [activeLocation, setActiveLocation, clearActiveLocation],
  )

  return <ActiveLocationContext.Provider value={value}>{children}</ActiveLocationContext.Provider>
}
