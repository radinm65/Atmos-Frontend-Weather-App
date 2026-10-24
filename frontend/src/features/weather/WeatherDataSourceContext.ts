import { createContext, useContext } from 'react'
import type { WeatherDataSource } from '../../lib/api'

export const WeatherDataSourceContext = createContext<WeatherDataSource | null>(null)

export function useWeatherDataSource(): WeatherDataSource {
  const source = useContext(WeatherDataSourceContext)
  if (!source) throw new Error('useWeatherDataSource must be used within <Providers>')
  return source
}
