import { useContext } from 'react'
import { ComparisonContext } from './ComparisonContext'
import type { ComparisonContextValue } from './ComparisonContext'

export function useComparison(): ComparisonContextValue {
  const context = useContext(ComparisonContext)
  if (!context) throw new Error('useComparison must be used within a ComparisonProvider')
  return context
}
