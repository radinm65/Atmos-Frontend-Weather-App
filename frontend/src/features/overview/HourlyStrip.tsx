import { motion } from 'motion/react'
import { WiRaindrop } from 'react-icons/wi'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { Value } from '../../components/ui/Value'
import type { WeatherReport } from '../../domain/weather'
import { formatPercent, formatTemperature, formatTime } from '../../lib/formatting'
import { useUnits } from '../preferences/useUnits'
import { hoursFromNow } from '../weather/selectors'
import { WeatherIcon } from '../weather/WeatherIcon'
import styles from './HourlyStrip.module.css'

const HOURS = 24

/** A swipeable row of the next 24 hours. */
export function HourlyStrip({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const hours = hoursFromNow(report, HOURS)
  if (hours.length === 0) return null

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby="hourly-title"
    >
      <h2 id="hourly-title" className={styles.title}>
        Next {hours.length} hours
      </h2>
      {/* Scrollable regions must be keyboard-focusable so keyboard users can scroll them. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className={styles.scroller} tabIndex={0} role="region" aria-labelledby="hourly-title">
        <ol className={styles.list}>
          {hours.map((hour, index) => (
            <motion.li
              key={hour.time}
              className={`${styles.hour} ${index === 0 ? styles.now : ''}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + index * 0.03,
                type: 'spring',
                stiffness: 160,
                damping: 20,
              }}
            >
              <span className={styles.time}>
                {index === 0 ? 'Now' : formatTime(hour.time, report.timezone)}
              </span>
              <WeatherIcon condition={hour.condition} isDay={hour.isDay} size={38} />
              <span className={styles.temp}>
                <Value
                  text={formatTemperature(hour.temperature, units.temperature, { withUnit: false })}
                />
              </span>
              <span className={styles.rain}>
                <WiRaindrop size={16} aria-hidden="true" />
                <Value text={formatPercent(hour.precipitationProbability)} />
              </span>
            </motion.li>
          ))}
        </ol>
      </div>
    </GlassPanel>
  )
}
