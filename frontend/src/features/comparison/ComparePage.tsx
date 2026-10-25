import { lazy, Suspense } from 'react'
import { StaggerGroup } from '../../components/motion/StaggerGroup'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useWeatherQueries } from '../weather/useWeather'
import { AddCities } from './AddCities'
import { CityCard } from './CityCard'
import styles from './ComparePage.module.css'
import { ComparisonTable } from './ComparisonTable'
import { MIN_COMPARED } from './comparisonStorage'
import { useComparison } from './useComparison'

// Recharts is heavy; keep it out of the initial bundle (TRD §9a).
const ComparisonChart = lazy(() => import('./ComparisonChart'))

export function ComparePage() {
  useDocumentTitle('Compare')
  const { cities, remove } = useComparison()
  // Same query definition (and cache) as the Overview: no separate API path for comparison.
  const queries = useWeatherQueries(cities)
  const reports = queries.map((query) => query.data ?? null)
  const comparable = cities.length >= MIN_COMPARED

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.heading}>Compare</h1>
        <p className={styles.intro}>
          Weather for up to four cities side by side, in your chosen units. Each city shows its own
          local time.
        </p>
      </div>

      <AddCities />

      {cities.length > 0 ? (
        <StaggerGroup className={styles.cards}>
          {cities.map((city, index) => {
            const query = queries[index]
            return (
              <CityCard
                key={city.id}
                location={city}
                index={index}
                report={reports[index] ?? null}
                isError={query?.isError ?? false}
                error={query?.error}
                onRetry={() => void query?.refetch()}
                onRemove={() => remove(city.id)}
              />
            )
          })}
        </StaggerGroup>
      ) : null}

      {comparable ? (
        <StaggerGroup className={styles.results}>
          <ComparisonTable cities={cities} reports={reports} />
          <Suspense
            fallback={
              <GlassPanel interactive={false} className={styles.chartFallback}>
                <span className="visually-hidden" role="status">
                  Loading chart
                </span>
              </GlassPanel>
            }
          >
            <ComparisonChart cities={cities} reports={reports} />
          </Suspense>
        </StaggerGroup>
      ) : null}
    </div>
  )
}
