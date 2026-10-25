import { createContext } from 'react'
import type { TemperatureUnit, UnitPreferences, WindSpeedUnit } from '../../lib/formatting'

export interface PreferencesContextValue {
  units: UnitPreferences
  setTemperatureUnit: (unit: TemperatureUnit) => void
  setWindSpeedUnit: (unit: WindSpeedUnit) => void
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)
