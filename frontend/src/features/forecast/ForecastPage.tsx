import { lazy, Suspense } from 'react'
import { StaggerGroup } from '../../components/motion/StaggerGroup'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { describeLocationDetail } from '../../domain/location'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { ChooseLocationPrompt } from '../locations/ChooseLocationPrompt'
import { useActiveLocation } from '../locations/useActiveLocation'
import { DailyList } from '../overview/DailyList'
import { HourlyStrip } from '../overview/HourlyStrip'
import { WeatherQueryState } from '../weather/WeatherQueryState'
import styles from './ForecastPage.module.css'
import { ForecastTables } from './ForecastTables'

// Recharts is heavy; keep it out of the initial bundle (TRD §9a).
const ForecastExplorer = lazy(() => import('./ForecastExplorer'))

export function ForecastPage() {
  useDocumentTitle('Forecast')
  const { activeLocation } = useActiveLocation()

  return (
    <div className={styles.page}>
      {activeLocation ? (
        <WeatherQueryState location={activeLocation}>
          {(report, freshness) => (
            <StaggerGroup className={styles.content}>
              <GlassPanel as="section" strong interactive={false} className={styles.header}>
                <div>
                  <h1 className={styles.heading}>Forecast</h1>
                  <p className={styles.place}>
                    {[report.location.name, describeLocationDetail(report.location)]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
                {freshness}
              </GlassPanel>

              <HourlyStrip report={report} />

              <Suspense
                fallback={
                  <GlassPanel interactive={false} className={styles.chartFallback}>
                    <span className="visually-hidden" role="status">
                      Loading chart
                    </span>
                  </GlassPanel>
                }
              >
                <ForecastExplorer report={report} />
              </Suspense>

              <DailyList report={report} />

              <GlassPanel as="section" interactive={false} className={styles.tables}>
                <details>
                  <summary className={styles.summary}>Show data tables</summary>
                  <ForecastTables report={report} />
                </details>
              </GlassPanel>
            </StaggerGroup>
          )}
        </WeatherQueryState>
      ) : (
        <>
          <h1 className="visually-hidden">Forecast</h1>
          <ChooseLocationPrompt />
        </>
      )}
    </div>
  )
}
