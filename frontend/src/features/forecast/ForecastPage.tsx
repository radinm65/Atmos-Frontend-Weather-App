import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { ChooseLocationPrompt } from '../locations/ChooseLocationPrompt'
import { useActiveLocation } from '../locations/useActiveLocation'
import { WeatherQueryState } from '../weather/WeatherQueryState'
import { ForecastTables } from './ForecastTables'
import styles from './ForecastPage.module.css'

export function ForecastPage() {
  useDocumentTitle('Forecast')
  const { activeLocation } = useActiveLocation()

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Forecast</h1>
      {activeLocation ? (
        <WeatherQueryState location={activeLocation}>
          {(report) => <ForecastTables report={report} />}
        </WeatherQueryState>
      ) : (
        <ChooseLocationPrompt />
      )}
    </div>
  )
}
