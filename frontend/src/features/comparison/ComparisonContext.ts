import { createContext } from 'react'
import type { Location } from '../../domain/location'

export type AddResult = 'added' | 'already-added' | 'full'

export interface ComparisonContextValue {
  cities: readonly Location[]
  max: number
  has: (id: string) => boolean
  add: (location: Location) => AddResult
  remove: (id: string) => void
  clear: () => void
}

export const ComparisonContext = createContext<ComparisonContextValue | null>(null)
