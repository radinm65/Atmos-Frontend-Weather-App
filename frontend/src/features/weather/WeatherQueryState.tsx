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
  /** Shown while the first load is in flight. Defaults to a generic skeleton. */
  loading?: ReactNode
  /** `freshness` is the "how current is this" label; place it wherever the layout wants it. */
  children: (report: WeatherReport, freshness: ReactNode) => ReactNode
}

/**
 * Loads weather for a location and renders loading, error, or success. After a successful load,
 * a failed refresh keeps the old data on screen, clearly marked as out of date in `freshness`.
 */
export function WeatherQueryState({ location, loading, children }: WeatherQueryStateProps) {
  const query = useWeather(location)

  if (query.data === undefined) {
    if (query.isError) {
      const { title, message } = describeError(query.error)
      return <ErrorState title={title} message={message} onRetry={() => void query.refetch()} />
    }
    return loading ?? <LoadingState label={`Loading weather for ${location.name}`} lines={4} />
  }

  const freshness = (
    <FreshnessLabel
      report={query.data}
      refreshFailed={query.isError}
      onRetry={() => void query.refetch()}
    />
  )
  return <>{children(query.data, freshness)}</>
}
