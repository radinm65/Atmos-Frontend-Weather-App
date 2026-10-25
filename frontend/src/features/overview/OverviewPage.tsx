import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { ChooseLocationPrompt } from '../locations/ChooseLocationPrompt'
import { useActiveLocation } from '../locations/useActiveLocation'
import { WeatherQueryState } from '../weather/WeatherQueryState'
import { Dashboard } from './Dashboard'
import styles from './OverviewPage.module.css'
import { OverviewSkeleton } from './OverviewSkeleton'

export function OverviewPage() {
  useDocumentTitle('Overview')
  const { activeLocation } = useActiveLocation()

  return (
    <div className={styles.page}>
      {/* The location name is the visible title; the page still needs an h1 for navigation. */}
      <h1 className="visually-hidden">Overview</h1>
      {activeLocation ? (
        <WeatherQueryState
          location={activeLocation}
          loading={<OverviewSkeleton placeName={activeLocation.name} />}
        >
          {(report, freshness) => <Dashboard report={report} freshness={freshness} />}
        </WeatherQueryState>
      ) : (
        <ChooseLocationPrompt />
      )}
    </div>
  )
}
