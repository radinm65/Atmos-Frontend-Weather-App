import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Location } from '../../domain/location'
import { ComparisonContext } from './ComparisonContext'
import type { AddResult, ComparisonContextValue } from './ComparisonContext'
import { MAX_COMPARED, loadComparison, writeComparison } from './comparisonStorage'

/** The cities being compared, remembered in this browser. */
export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<readonly Location[]>(loadComparison)

  const commit = useCallback((next: readonly Location[]) => {
    setCities(next)
    writeComparison(next)
  }, [])

  const has = useCallback((id: string) => cities.some((city) => city.id === id), [cities])

  const add = useCallback(
    (location: Location): AddResult => {
      if (cities.some((city) => city.id === location.id)) return 'already-added'
      if (cities.length >= MAX_COMPARED) return 'full'
      commit([...cities, location])
      return 'added'
    },
    [cities, commit],
  )

  const remove = useCallback(
    (id: string) => commit(cities.filter((city) => city.id !== id)),
    [cities, commit],
  )

  const clear = useCallback(() => commit([]), [commit])

  const value = useMemo<ComparisonContextValue>(
    () => ({ cities, max: MAX_COMPARED, has, add, remove, clear }),
    [cities, has, add, remove, clear],
  )

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>
}
