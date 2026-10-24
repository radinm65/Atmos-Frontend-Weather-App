/** Domain values are metric. Conversion happens only here, at display time (D-10). */

export type TemperatureUnit = 'c' | 'f'
export type WindSpeedUnit = 'kmh' | 'mph'

export interface UnitPreferences {
  temperature: TemperatureUnit
  windSpeed: WindSpeedUnit
}

/** The unit toggle UI and its persistence arrive in Phase 4. */
export const DEFAULT_UNITS: UnitPreferences = { temperature: 'c', windSpeed: 'kmh' }

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'f' ? (celsius * 9) / 5 + 32 : celsius
}

const KMH_PER_MPH = 1.609344

export function convertWindSpeed(kmh: number, unit: WindSpeedUnit): number {
  return unit === 'mph' ? kmh / KMH_PER_MPH : kmh
}
