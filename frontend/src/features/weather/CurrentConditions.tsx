import { Value } from '../../components/ui/Value'
import { describeLocationDetail } from '../../domain/location'
import type { WeatherReport } from '../../domain/weather'
import {
  formatPercent,
  formatPrecipitation,
  formatTemperature,
  formatWindSpeed,
} from '../../lib/formatting'
import { useUnits } from '../preferences/useUnits'
import styles from './CurrentConditions.module.css'

/**
 * Plain current-conditions summary. The cinematic hero is built in Phase 3; this shows the real
 * data with correct units, missing values and text for the condition.
 */
export function CurrentConditions({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const { location, current } = report
  const detail = describeLocationDetail(location)

  const metrics: { label: string; value: string }[] = [
    { label: 'Feels like', value: formatTemperature(current.feelsLike, units.temperature) },
    { label: 'Humidity', value: formatPercent(current.humidity) },
    { label: 'Wind', value: formatWindSpeed(current.windSpeed, units.windSpeed) },
    { label: 'Precipitation', value: formatPrecipitation(current.precipitation) },
  ]

  return (
    <section className={styles.card} aria-labelledby="current-heading">
      <div className={styles.summary}>
        <div>
          <h2 id="current-heading" className={styles.place}>
            {location.name}
          </h2>
          {detail ? <p className={styles.detail}>{detail}</p> : null}
        </div>
        <p className={styles.temperature}>
          <Value text={formatTemperature(current.temperature, units.temperature)} />
        </p>
        <p className={styles.condition}>{current.condition.label}</p>
      </div>

      <dl className={styles.metrics}>
        {metrics.map(({ label, value }) => (
          <div key={label} className={styles.metric}>
            <dt>{label}</dt>
            <dd>
              <Value text={value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
