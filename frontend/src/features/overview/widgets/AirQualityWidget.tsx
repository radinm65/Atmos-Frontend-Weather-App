import { Leaf } from 'lucide-react'
import { AnimatedNumber } from '../../../components/motion/AnimatedNumber'
import { Button } from '../../../components/ui/Button'
import { RingGauge } from '../../../components/ui/RingGauge'
import { AQI_LABELS, aqiCategory } from '../../../domain/airQuality'
import type { Location } from '../../../domain/location'
import { WeatherApiError } from '../../../lib/api'
import { describeError } from '../../../lib/api'
import { fraction } from '../../../lib/math'
import { useAirQuality } from '../../weather/useAirQuality'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

const AQI_COLOR = {
  good: 'var(--aqi-good)',
  moderate: 'var(--aqi-moderate)',
  sensitive: 'var(--aqi-sensitive)',
  unhealthy: 'var(--aqi-unhealthy)',
  'very-unhealthy': 'var(--aqi-very-unhealthy)',
  hazardous: 'var(--aqi-hazardous)',
} as const

function Pollutant({ name, value, unit }: { name: string; value: number | null; unit: string }) {
  return (
    <span className={styles.chip}>
      <span className={styles.muted}>{name}</span>
      <strong>{value === null ? '—' : `${Math.round(value * 10) / 10}`}</strong>
      <span className={styles.muted}>{unit}</span>
    </span>
  )
}

/**
 * Air quality has its own request, so loading and failure stay inside this widget and never blank
 * the rest of the page.
 */
export function AirQualityWidget({ location }: { location: Location }) {
  const query = useAirQuality(location)

  if (query.isPending) {
    return (
      <Widget title="Air quality" icon={Leaf} note="Loading air quality…">
        <div role="status" className={styles.muted}>
          <span className="visually-hidden">Loading air quality</span>
        </div>
      </Widget>
    )
  }

  if (query.isError || !query.data) {
    const notRecorded =
      query.error instanceof WeatherApiError && query.error.kind === 'not-available'
    return (
      <Widget
        title="Air quality"
        icon={Leaf}
        note={
          notRecorded
            ? 'Air quality is not part of the recorded data.'
            : describeError(query.error).message
        }
      >
        <p className={styles.error}>Air quality is unavailable.</p>
        {notRecorded ? null : (
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Try again
          </Button>
        )}
      </Widget>
    )
  }

  const report = query.data
  const aqi = report.usAqi
  const category = aqi === null ? null : aqiCategory(aqi)

  return (
    <Widget
      title="Air quality"
      icon={Leaf}
      note={
        category ? `${AQI_LABELS[category]} (US AQI).` : 'The air quality index is not available.'
      }
    >
      <RingGauge
        fraction={aqi === null ? 0 : fraction(aqi, 0, 200)}
        color={category ? AQI_COLOR[category] : 'var(--color-text-muted)'}
      >
        <span className={styles.stack}>
          <span className={styles.value}>
            {aqi === null ? (
              '—'
            ) : (
              <AnimatedNumber value={aqi} format={(n) => String(Math.round(n))} />
            )}
          </span>
          <span className={styles.unit}>AQI</span>
        </span>
      </RingGauge>
      <div className={styles.chips}>
        <Pollutant name="PM2.5" value={report.pm25} unit="µg/m³" />
        <Pollutant name="PM10" value={report.pm10} unit="µg/m³" />
        <Pollutant name="Ozone" value={report.ozone} unit="µg/m³" />
        <Pollutant name="NO₂" value={report.nitrogenDioxide} unit="µg/m³" />
      </div>
    </Widget>
  )
}
