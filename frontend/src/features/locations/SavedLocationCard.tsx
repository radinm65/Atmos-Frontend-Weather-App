import { motion } from 'motion/react'
import { ArrowRight, Check, GitCompareArrows, Trash2 } from 'lucide-react'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { Value } from '../../components/ui/Value'
import { describeLocationDetail } from '../../domain/location'
import type { Location } from '../../domain/location'
import { describeError } from '../../lib/api'
import { formatTemperature, formatTime } from '../../lib/formatting'
import { useComparison } from '../comparison/useComparison'
import { useUnits } from '../preferences/useUnits'
import { dailyForToday } from '../weather/selectors'
import { useWeather } from '../weather/useWeather'
import { WeatherIcon } from '../weather/WeatherIcon'
import styles from './SavedLocationCard.module.css'

export interface SavedLocationCardProps {
  location: Location
  active: boolean
  onView: () => void
  onRemove: () => void
}

/**
 * One saved place with a live mini-forecast. It reads the same cached weather query as the
 * Overview, so the active city costs no extra request. A failure stays inside this card.
 */
export function SavedLocationCard({ location, active, onView, onRemove }: SavedLocationCardProps) {
  const units = useUnits()
  const comparison = useComparison()
  const query = useWeather(location)
  const report = query.data
  const day = report ? dailyForToday(report) : null
  const detail = describeLocationDetail(location)
  const t = (c: number | null | undefined) =>
    formatTemperature(c ?? null, units.temperature, { withUnit: false })

  return (
    <GlassPanel as="article" className={styles.card} aria-label={location.name}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.name}>{location.name}</h2>
          {detail ? <p className={styles.detail}>{detail}</p> : null}
        </div>
        <IconButton
          label={`Remove ${location.name} from saved locations`}
          icon={<Trash2 size={18} />}
          onClick={onRemove}
        />
      </header>

      <div className={styles.weather}>
        {report ? (
          <motion.div
            className={styles.now}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <WeatherIcon
              condition={report.current.condition}
              isDay={report.current.isDay}
              size={56}
            />
            <div>
              <p className={styles.temperature}>
                <Value text={t(report.current.temperature)} />
              </p>
              <p className={styles.condition}>{report.current.condition.label}</p>
              <p className={styles.range}>
                H <Value text={t(day?.maxTemperature)} /> · L{' '}
                <Value text={t(day?.minTemperature)} />
                {' · '}
                {formatTime(report.current.observedAt, report.timezone)} local
              </p>
            </div>
          </motion.div>
        ) : query.isError ? (
          <div role="alert" className={styles.problem}>
            <p>{describeError(query.error).message}</p>
            <Button variant="ghost" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <div role="status" className={styles.loading}>
            <span className="visually-hidden">Loading weather for {location.name}</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant={active ? 'secondary' : 'primary'} onClick={onView}>
          {active ? 'Showing now' : 'View weather'}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
        {comparison.has(location.id) ? (
          <Button
            variant="ghost"
            aria-label={`Remove ${location.name} from the comparison`}
            onClick={() => comparison.remove(location.id)}
          >
            <Check size={16} aria-hidden="true" />
            Comparing
          </Button>
        ) : (
          <Button
            variant="ghost"
            aria-label={`Compare ${location.name}`}
            disabled={comparison.cities.length >= comparison.max}
            onClick={() => comparison.add(location)}
          >
            <GitCompareArrows size={16} aria-hidden="true" />
            Compare
          </Button>
        )}
      </div>
    </GlassPanel>
  )
}
