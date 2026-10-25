import type { WeatherCondition } from '../../domain/weather'
import { WEATHER_ICONS, weatherIconKey } from './weatherIcons'

export interface WeatherIconProps {
  condition: WeatherCondition | null
  isDay: boolean | null
  size?: number
  className?: string
}

/** Decorative: the condition is always spelled out in text beside it. */
export function WeatherIcon({ condition, isDay, size = 32, className }: WeatherIconProps) {
  const key = weatherIconKey(condition?.code ?? null, condition?.category ?? 'unknown', isDay)
  const Icon = WEATHER_ICONS[key]
  return <Icon size={size} aria-hidden="true" className={className} />
}
