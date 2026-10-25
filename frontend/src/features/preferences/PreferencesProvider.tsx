import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { TemperatureUnit, UnitPreferences, WindSpeedUnit } from '../../lib/formatting'
import { PreferencesContext } from './PreferencesContext'
import type { PreferencesContextValue } from './PreferencesContext'
import { loadUnits, saveUnits } from './preferencesStorage'

/** Unit preferences, loaded from (and saved to) this browser's local storage. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<UnitPreferences>(loadUnits)

  const update = useCallback((patch: Partial<UnitPreferences>) => {
    setUnits((current) => {
      const next = { ...current, ...patch }
      saveUnits(next)
      return next
    })
  }, [])

  const setTemperatureUnit = useCallback(
    (temperature: TemperatureUnit) => update({ temperature }),
    [update],
  )
  const setWindSpeedUnit = useCallback(
    (windSpeed: WindSpeedUnit) => update({ windSpeed }),
    [update],
  )

  const value = useMemo<PreferencesContextValue>(
    () => ({ units, setTemperatureUnit, setWindSpeedUnit }),
    [units, setTemperatureUnit, setWindSpeedUnit],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
