import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { AnimatedNumber } from '../../components/motion/AnimatedNumber'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { Value } from '../../components/ui/Value'
import { describeLocationDetail } from '../../domain/location'
import type { WeatherReport } from '../../domain/weather'
import {
  MISSING,
  convertTemperature,
  formatDateTime,
  formatTemperature,
} from '../../lib/formatting'
import { useUnits } from '../preferences/useUnits'
import { describeFeelsLike } from '../weather/describe'
import { summarizeDay } from './summary'
import { dailyForToday } from '../weather/selectors'
import { WeatherIcon } from '../weather/WeatherIcon'
import styles from './HeroCard.module.css'

export interface HeroCardProps {
  report: WeatherReport
  /** The freshness label, so it sits inside the card. */
  freshness: ReactNode
}

export function HeroCard({ report, freshness }: HeroCardProps) {
  const units = useUnits()
  const { location, current, timezone } = report
  const day = dailyForToday(report)
  const detail = describeLocationDetail(location)
  const formatT = (c: number | null) => formatTemperature(c, units.temperature, { withUnit: false })
  const unitLetter = units.temperature === 'f' ? 'F' : 'C'

  return (
    <GlassPanel
      as="section"
      strong
      interactive={false}
      className={styles.hero}
      aria-labelledby="hero-place"
    >
      <div className={styles.top}>
        <div>
          <h2 id="hero-place" className={styles.place}>
            {location.name}
          </h2>
          <p className={styles.detail}>
            {[detail, `${formatDateTime(current.observedAt, timezone)} local time`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {freshness}
      </div>

      <div className={styles.main}>
        <div className={styles.readout}>
          <p className={styles.temperature}>
            {current.temperature === null ? (
              <Value text={MISSING} />
            ) : (
              <>
                <AnimatedNumber
                  value={convertTemperature(current.temperature, units.temperature)}
                  format={(n) => `${Math.round(n) || 0}°`}
                />
                <span className={styles.unit}>{unitLetter}</span>
              </>
            )}
          </p>
          <p className={styles.condition}>
            <WeatherIcon condition={current.condition} isDay={current.isDay} size={34} />
            {current.condition.label}
          </p>
          <p className={styles.highLow}>
            <span>
              H <strong>{formatT(day?.maxTemperature ?? null)}</strong>
            </span>
            <span>
              L <strong>{formatT(day?.minTemperature ?? null)}</strong>
            </span>
            <span>
              Feels like{' '}
              <strong>
                <Value text={formatT(current.feelsLike)} />
              </strong>
            </span>
          </p>
        </div>

        <motion.div
          className={styles.bigIcon}
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0, y: [0, -12, 0] }}
          transition={{
            opacity: { duration: 0.8 },
            scale: { type: 'spring', stiffness: 90, damping: 14 },
            rotate: { type: 'spring', stiffness: 90, damping: 14 },
            y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <WeatherIcon condition={current.condition} isDay={current.isDay} size={220} />
        </motion.div>
      </div>

      <p className={styles.summary}>
        {summarizeDay(report, formatT)}{' '}
        {current.temperature !== null && current.feelsLike !== null
          ? describeFeelsLike(current.temperature, current.feelsLike)
          : ''}
      </p>
    </GlassPanel>
  )
}
