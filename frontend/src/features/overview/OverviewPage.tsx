import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { ChooseLocationPrompt } from '../locations/ChooseLocationPrompt'
import { useActiveLocation } from '../locations/useActiveLocation'
import { CurrentConditions } from '../weather/CurrentConditions'
import { WeatherQueryState } from '../weather/WeatherQueryState'
import styles from './OverviewPage.module.css'

export function OverviewPage() {
  useDocumentTitle('Overview')
  const { activeLocation } = useActiveLocation()

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Overview</h1>
      {activeLocation ? (
        <WeatherQueryState location={activeLocation}>
          {(report) => <CurrentConditions report={report} />}
        </WeatherQueryState>
      ) : (
        <ChooseLocationPrompt />
      )}
    </div>
  )
}
