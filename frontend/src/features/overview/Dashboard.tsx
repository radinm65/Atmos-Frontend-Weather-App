import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { StaggerGroup } from '../../components/motion/StaggerGroup'
import { GlassPanel } from '../../components/ui/GlassPanel'
import type { WeatherReport } from '../../domain/weather'
import styles from './Dashboard.module.css'
import { DailyList } from './DailyList'
import { HeroCard } from './HeroCard'
import { HourlyStrip } from './HourlyStrip'
import { AirQualityWidget } from './widgets/AirQualityWidget'
import { CloudWidget } from './widgets/CloudWidget'
import { HumidityWidget } from './widgets/HumidityWidget'
import { PrecipitationWidget } from './widgets/PrecipitationWidget'
import { PressureWidget } from './widgets/PressureWidget'
import { SunWidget } from './widgets/SunWidget'
import { UvWidget } from './widgets/UvWidget'
import { VisibilityWidget } from './widgets/VisibilityWidget'
import { WindWidget } from './widgets/WindWidget'

// Recharts is heavy; keep it out of the initial bundle (TRD §9a).
const HourlyChart = lazy(() => import('./HourlyChart'))
const WindChart = lazy(() => import('./WindChart'))

function ChartFallback() {
  return (
    <GlassPanel interactive={false} className={styles.chartFallback}>
      <span className="visually-hidden" role="status">
        Loading chart
      </span>
    </GlassPanel>
  )
}

/** The Overview dashboard: hero, hourly strip, outlook and chart, then the detail widgets. */
export function Dashboard({ report, freshness }: { report: WeatherReport; freshness: ReactNode }) {
  return (
    <StaggerGroup className={styles.dashboard}>
      <HeroCard report={report} freshness={freshness} />
      <HourlyStrip report={report} />

      <div className={styles.split}>
        <DailyList report={report} />
        <div className={styles.side}>
          <Suspense fallback={<ChartFallback />}>
            <HourlyChart report={report} />
            <WindChart report={report} />
          </Suspense>
        </div>
      </div>

      <section className={styles.details} aria-labelledby="details-title">
        <h2 id="details-title" className="visually-hidden">
          Conditions in detail
        </h2>
        <WindWidget report={report} />
        <HumidityWidget report={report} />
        <UvWidget report={report} />
        <PressureWidget report={report} />
        <SunWidget report={report} />
        <PrecipitationWidget report={report} />
        <VisibilityWidget report={report} />
        <CloudWidget report={report} />
        <AirQualityWidget location={report.location} />
      </section>
    </StaggerGroup>
  )
}
