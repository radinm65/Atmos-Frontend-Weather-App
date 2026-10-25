import type { UnitPreferences } from '../../lib/formatting'
import { usePreferences } from './usePreferences'

/** The unit preferences used for display. Domain values stay metric; conversion is display-only. */
export function useUnits(): UnitPreferences {
  return usePreferences().units
}
