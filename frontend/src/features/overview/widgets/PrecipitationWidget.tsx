import { motion } from 'motion/react'
import { Umbrella } from 'lucide-react'
import type { WeatherReport } from '../../../domain/weather'
import { formatPercent, formatPrecipitation, formatTime } from '../../../lib/formatting'
import { dailyForToday, hoursFromNow } from '../../weather/selectors'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

export function PrecipitationWidget({ report }: { report: WeatherReport }) {
  const day = dailyForToday(report)
  const hours = hoursFromNow(report, 24)
  const chance = day?.precipitationProbability ?? null
  const dry = day?.precipitationSum === 0 && (chance ?? 0) < 20

  const note =
    day?.precipitationSum === null || day === null
      ? 'Precipitation is not available.'
      : dry
        ? 'No precipitation expected today.'
        : `${formatPercent(chance)} chance of precipitation; ${day.precipitationHours === null ? 'some' : Math.round(day.precipitationHours)} wet hour${day.precipitationHours === 1 ? '' : 's'} today.`

  return (
    <Widget title="Precipitation" icon={Umbrella} note={note}>
      <div className={styles.stack}>
        <span className={styles.value}>
          {formatPrecipitation(day?.precipitationSum)}
          <span className={styles.unit}>today</span>
        </span>
      </div>
      <div
        className={styles.bars}
        role="img"
        aria-label={`Chance of rain for each of the next ${hours.length} hours`}
      >
        {hours.map((hour, index) => {
          const p = hour.precipitationProbability
          return (
            <motion.span
              key={hour.time}
              className={styles.bar}
              title={`${formatTime(hour.time, report.timezone)}: ${formatPercent(p)}`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                delay: 0.3 + index * 0.025,
                type: 'spring',
                stiffness: 140,
                damping: 16,
              }}
              style={{ height: `${Math.max(p ?? 0, 4)}%`, opacity: p === null ? 0.25 : 1 }}
            />
          )
        })}
      </div>
    </Widget>
  )
}
