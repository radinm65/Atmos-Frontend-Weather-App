import { motion } from 'motion/react'
import { Sunrise } from 'lucide-react'
import type { WeatherReport } from '../../../domain/weather'
import { MISSING, formatDuration, formatTime } from '../../../lib/formatting'
import { dailyForToday, daylightProgress } from '../../weather/selectors'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

const CX = 100
const CY = 90
const R = 80

export function SunWidget({ report }: { report: WeatherReport }) {
  const day = dailyForToday(report)
  const { timezone } = report
  const progress = day ? daylightProgress(report.current.observedAt, day.sunrise, day.sunset) : null
  const angle = progress === null ? Math.PI : Math.PI * (1 - progress)
  const sun = { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) }
  const arc = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

  const note =
    !day || !day.sunrise || !day.sunset
      ? 'Sunrise and sunset are not available for this place and date.'
      : progress === null
        ? `The sun is down. Daylight today: ${formatDuration(day.daylightSeconds)}.`
        : `Daylight today: ${formatDuration(day.daylightSeconds)}.`

  return (
    <Widget title="Sunrise & sunset" icon={Sunrise} note={note}>
      <svg viewBox="0 0 200 104" className={styles.sunArc} aria-hidden="true">
        <defs>
          <linearGradient id="sun-arc-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ffb454" />
            <stop offset="50%" stopColor="#ffe28a" />
            <stop offset="100%" stopColor="#ff8a5c" />
          </linearGradient>
        </defs>
        <path
          d={arc}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth="5"
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
        <motion.path
          d={arc}
          fill="none"
          stroke="url(#sun-arc-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress ?? 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <line x1="6" x2="194" y1={CY} y2={CY} stroke="var(--color-border-strong)" strokeWidth="1" />
        {progress !== null ? (
          <>
            <motion.circle
              cx={sun.x}
              cy={sun.y}
              fill="#ffd45e"
              opacity="0.3"
              initial={{ r: 0 }}
              animate={{ r: [0, 15, 12] }}
              transition={{ duration: 1.6, delay: 0.5 }}
            />
            <motion.circle
              cx={sun.x}
              cy={sun.y}
              fill="#fff4c2"
              stroke="#ffb454"
              strokeWidth="2"
              initial={{ r: 0 }}
              animate={{ r: 7.5 }}
              transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.5 }}
            />
          </>
        ) : null}
      </svg>
      <div className={styles.sunTimes}>
        <span>
          <span className={styles.muted}>Sunrise</span>
          <strong>{day?.sunrise ? formatTime(day.sunrise, timezone) : MISSING}</strong>
        </span>
        <span style={{ textAlign: 'right' }}>
          <span className={styles.muted}>Sunset</span>
          <strong>{day?.sunset ? formatTime(day.sunset, timezone) : MISSING}</strong>
        </span>
      </div>
    </Widget>
  )
}
