import type { ReactNode } from 'react'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import type { Location } from '../../domain/location'
import type { WeatherReport } from '../../domain/weather'
import { describeError } from '../../lib/api'
import { FreshnessLabel } from './FreshnessLabel'
import { useWeather } from './useWeather'

export interface WeatherQueryStateProps {
  location: Location
  children: (report: WeatherReport) => ReactNode
}

/**
 * Loads weather for a location and renders loading, error, or success. After a successful load,
 * a failed refresh keeps the old data on screen, clearly marked as out of date.
 */
export function WeatherQueryState({ location, children }: WeatherQueryStateProps) {
  const query = useWeather(location)

  if (query.data === undefined) {
    if (query.isError) {
      const { title, message } = describeError(query.error)
      return <ErrorState title={title} message={message} onRetry={() => void query.refetch()} />
    }
    return <LoadingState label={`Loading weather for ${location.name}`} lines={4} />
  }

  return (
    <>
      <FreshnessLabel
        report={query.data}
        refreshFailed={query.isError}
        onRetry={() => void query.refetch()}
      />
      {children(query.data)}
    </>
  )
}
