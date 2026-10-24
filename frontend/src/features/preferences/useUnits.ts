import { DEFAULT_UNITS } from '../../lib/formatting'
import type { UnitPreferences } from '../../lib/formatting'

/**
 * Unit preferences used for display. Always metric for now; Phase 4 replaces this with the
 * persisted °C/°F and km/h/mph choice without changing callers.
 */
export function useUnits(): UnitPreferences {
  return DEFAULT_UNITS
}
