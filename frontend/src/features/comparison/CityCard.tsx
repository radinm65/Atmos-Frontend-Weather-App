import { X } from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { Value } from '../../components/ui/Value'
import { describeLocationDetail } from '../../domain/location'
import type { Location } from '../../domain/location'
import type { WeatherReport } from '../../domain/weather'
import { describeError } from '../../lib/api'
import { formatTemperature, formatTime } from '../../lib/formatting'
import { useUnits } from '../preferences/useUnits'
import { WeatherIcon } from '../weather/WeatherIcon'
import styles from './CityCard.module.css'
import { seriesStyle } from './seriesStyle'

export interface CityCardProps {
  location: Location
  index: number
  report: WeatherReport | null
  isError: boolean
  error: unknown
  onRetry: () => void
  onRemove: () => void
}

/** One compared city. It shows its own loading and error state, so one failure never hides the rest. */
export function CityCard({
  location,
  index,
  report,
  isError,
  error,
  onRetry,
  onRemove,
}: CityCardProps) {
  const units = useUnits()
  const style = seriesStyle(index)
  const detail = describeLocationDetail(location)

  return (
    <GlassPanel as="article" aria-label={location.name} className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.name}>
            <span
              className={styles.swatch}
              style={{ background: style.color }}
              aria-hidden="true"
              title={style.pattern}
            />
            {location.name}
          </h2>
          {detail ? <p className={styles.detail}>{detail}</p> : null}
        </div>
        <IconButton
          label={`Remove ${location.name} from the comparison`}
          icon={<X size={18} />}
          onClick={onRemove}
        />
      </header>

      {report ? (
        <>
          <p className={styles.local}>
            <strong>{formatTime(report.current.observedAt, report.timezone)}</strong> local time
            <span className={styles.zone}> · {report.timezone}</span>
          </p>
          <div className={styles.now}>
            <WeatherIcon
              condition={report.current.condition}
              isDay={report.current.isDay}
              size={52}
            />
            <div>
              <p className={styles.temperature}>
                <Value
                  text={formatTemperature(report.current.temperature, units.temperature, {
                    withUnit: false,
                  })}
                />
              </p>
              <p className={styles.condition}>{report.current.condition.label}</p>
            </div>
          </div>
        </>
      ) : isError ? (
        <div role="alert" className={styles.problem}>
          <p>{describeError(error).message}</p>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : (
        <div role="status" className={styles.loading}>
          <span className="visually-hidden">Loading weather for {location.name}</span>
        </div>
      )}
    </GlassPanel>
  )
}
