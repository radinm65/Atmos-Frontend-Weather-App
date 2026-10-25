import { ArrowRight, GitCompareArrows, MapPin } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { Value } from '../../components/ui/Value'
import { describeLocationDetail } from '../../domain/location'
import type { Location } from '../../domain/location'
import { describeError } from '../../lib/api'
import {
  formatPercent,
  formatPrecipitation,
  formatTemperature,
  formatTime,
  formatWindSpeed,
} from '../../lib/formatting'
import { useComparison } from '../comparison/useComparison'
import { SaveLocationButton } from '../locations/SaveLocationButton'
import { useUnits } from '../preferences/useUnits'
import { dailyForToday } from '../weather/selectors'
import { useWeather } from '../weather/useWeather'
import { WeatherIcon } from '../weather/WeatherIcon'
import styles from './PlaceDetails.module.css'
import { formatCoordinates, isPin } from './pin'

export interface PlaceDetailsProps {
  location: Location | null
  onOpenWeather: (location: Location) => void
}

/** What is known about the place chosen on the map, with the actions that make it useful. */
export function PlaceDetails({ location, onOpenWeather }: PlaceDetailsProps) {
  const units = useUnits()
  const query = useWeather(location)
  const comparison = useComparison()

  if (!location) {
    return (
      <GlassPanel
        as="section"
        interactive={false}
        className={styles.panel}
        aria-label="Selected place"
      >
        <h2 className={styles.title}>
          <MapPin size={18} aria-hidden="true" /> Selected place
        </h2>
        <p className={styles.note}>
          Tap or click the map, or search for a city, to see its weather here.
        </p>
      </GlassPanel>
    )
  }

  const report = query.data
  const day = report ? dailyForToday(report) : null
  const detail = describeLocationDetail(location)
  const t = (value: number | null | undefined) =>
    formatTemperature(value ?? null, units.temperature, { withUnit: false })
  const inComparison = comparison.has(location.id)

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby="place-title"
    >
      <h2 id="place-title" className={styles.name}>
        {location.name}
      </h2>
      <p className={styles.detail}>
        {detail ? `${detail} · ` : ''}
        {isPin(location) ? 'Dropped pin' : formatCoordinates(location.latitude, location.longitude)}
      </p>

      {report ? (
        <>
          <div className={styles.now}>
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
            </div>
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>High / low</dt>
              <dd>
                <Value text={t(day?.maxTemperature)} /> / <Value text={t(day?.minTemperature)} />
              </dd>
            </div>
            <div>
              <dt>Wind</dt>
              <dd>
                <Value text={formatWindSpeed(report.current.windSpeed, units.windSpeed)} />
              </dd>
            </div>
            <div>
              <dt>Chance of rain</dt>
              <dd>
                <Value text={formatPercent(day?.precipitationProbability)} />
              </dd>
            </div>
            <div>
              <dt>Rain today</dt>
              <dd>
                <Value text={formatPrecipitation(day?.precipitationSum)} />
              </dd>
            </div>
          </dl>
          <p className={styles.note}>
            Local time {formatTime(report.current.observedAt, report.timezone)} ({report.timezone})
          </p>
        </>
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

      <div className={styles.actions}>
        <Button variant="primary" onClick={() => onOpenWeather(location)}>
          Open full weather
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
        <SaveLocationButton location={location} />
        {inComparison ? (
          <Button
            variant="ghost"
            aria-label={`Comparing. Remove ${location.name} from the comparison`}
            onClick={() => comparison.remove(location.id)}
          >
            Comparing
          </Button>
        ) : (
          <Button
            variant="ghost"
            aria-label={`Compare ${location.name}`}
            disabled={comparison.cities.length >= comparison.max}
            title={
              comparison.cities.length >= comparison.max
                ? `The comparison is full (${comparison.max} cities).`
                : undefined
            }
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
