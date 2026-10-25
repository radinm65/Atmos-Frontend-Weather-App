import { motion } from 'motion/react'
import { WiRaindrop } from 'react-icons/wi'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { Value } from '../../components/ui/Value'
import type { WeatherReport } from '../../domain/weather'
import { formatPercent, formatTemperature, formatWeekday, toLocalDate } from '../../lib/formatting'
import { fraction } from '../../lib/math'
import { useUnits } from '../preferences/useUnits'
import { temperatureExtent } from '../weather/selectors'
import { temperatureColor } from '../weather/tempColor'
import { WeatherIcon } from '../weather/WeatherIcon'
import styles from './DailyList.module.css'

/**
 * The multi-day outlook as rows with a coloured low–high range bar, scaled across the whole
 * period so days compare at a glance. The heading states how many days the provider returned.
 */
export function DailyList({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const extent = temperatureExtent(report.daily)
  const today = toLocalDate(report.current.observedAt, report.timezone)
  const [lowest, highest] = extent ?? [0, 0]
  const nowTemperature = report.current.temperature

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby="daily-title"
    >
      <h2 id="daily-title" className={styles.title}>
        {report.daily.length}-day forecast
      </h2>
      <ul className={styles.list}>
        {report.daily.map((day, index) => {
          const min = day.minTemperature
          const max = day.maxTemperature
          const known = extent !== null && min !== null && max !== null
          const left = known ? fraction(min, lowest, highest) * 100 : 0
          const width = known ? Math.max(fraction(max, lowest, highest) * 100 - left, 5) : 0
          const isToday = day.date === today
          const dot =
            isToday && known && nowTemperature !== null
              ? fraction(nowTemperature, min, max) * 100
              : null

          return (
            <motion.li
              key={day.date}
              className={styles.row}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.2 + index * 0.05,
                type: 'spring',
                stiffness: 150,
                damping: 20,
              }}
            >
              <span className={styles.day}>{isToday ? 'Today' : formatWeekday(day.date)}</span>
              <span className={styles.icon} title={day.condition?.label}>
                <WeatherIcon condition={day.condition} isDay={true} size={34} />
                <span className="visually-hidden">
                  {day.condition?.label ?? 'Conditions unavailable'}
                </span>
              </span>
              <span className={styles.rain}>
                <WiRaindrop size={15} aria-hidden="true" />
                <Value text={formatPercent(day.precipitationProbability)} />
              </span>
              <span className={styles.low}>
                <Value text={formatTemperature(min, units.temperature, { withUnit: false })} />
              </span>
              <span className={styles.track} aria-hidden="true">
                {known ? (
                  <motion.span
                    className={styles.fill}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      background: `linear-gradient(90deg, ${temperatureColor(min)}, ${temperatureColor(max)})`,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      delay: 0.35 + index * 0.05,
                      type: 'spring',
                      stiffness: 110,
                      damping: 18,
                    }}
                  >
                    {dot !== null ? (
                      <span className={styles.dot} style={{ left: `${dot}%` }} />
                    ) : null}
                  </motion.span>
                ) : null}
              </span>
              <span className={styles.high}>
                <Value text={formatTemperature(max, units.temperature, { withUnit: false })} />
              </span>
            </motion.li>
          )
        })}
      </ul>
    </GlassPanel>
  )
}
