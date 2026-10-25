import type { DataSourceInfo } from './weather'

/** Air quality for a place. Concentrations are µg/m³ (CO included); indices are unitless. */
export interface AirQualityReport {
  /** US AQI, 0–500. */
  usAqi: number | null
  /** European AQI, 0–100+. */
  europeanAqi: number | null
  pm25: number | null
  pm10: number | null
  ozone: number | null
  nitrogenDioxide: number | null
  sulphurDioxide: number | null
  carbonMonoxide: number | null
  /** Hourly US AQI, for a short trend. */
  hourly: { time: string; usAqi: number | null }[]
  observedAt: string
  fetchedAt: string
  source: DataSourceInfo
}

export type AqiCategory =
  'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous'

/** US EPA AQI bands. */
export function aqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return 'moderate'
  if (aqi <= 150) return 'sensitive'
  if (aqi <= 200) return 'unhealthy'
  if (aqi <= 300) return 'very-unhealthy'
  return 'hazardous'
}

export const AQI_LABELS: Record<AqiCategory, string> = {
  good: 'Good',
  moderate: 'Moderate',
  sensitive: 'Unhealthy for sensitive groups',
  unhealthy: 'Unhealthy',
  'very-unhealthy': 'Very unhealthy',
  hazardous: 'Hazardous',
}
