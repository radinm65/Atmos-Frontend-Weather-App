import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, Gauge, Minus } from 'lucide-react'
import { Value } from '../../../components/ui/Value'
import type { WeatherReport } from '../../../domain/weather'
import { MISSING } from '../../../lib/formatting'
import { fraction } from '../../../lib/math'
import { describePressure, pressureTrend } from '../../weather/describe'
import { hoursFromNow } from '../../weather/selectors'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

const MIN_HPA = 960
const MAX_HPA = 1060
const CENTER = 60
const RADIUS = 48

const TREND_TEXT = { rising: 'Rising', falling: 'Falling', steady: 'Steady' } as const

export function PressureWidget({ report }: { report: WeatherReport }) {
  const { pressure } = report.current
  const later = hoursFromNow(report, 4)[3]?.pressure ?? null
  const trend = pressureTrend(pressure, later)
  const f = pressure === null ? 0 : fraction(pressure, MIN_HPA, MAX_HPA)
  const angle = Math.PI * (1 - f)
  const tip = { x: CENTER + RADIUS * Math.cos(angle), y: CENTER - RADIUS * Math.sin(angle) }
  const TrendIcon = trend === 'rising' ? ArrowUp : trend === 'falling' ? ArrowDown : Minus

  return (
    <Widget
      title="Pressure"
      icon={Gauge}
      note={
        pressure === null
          ? 'Pressure is not available.'
          : `${describePressure(pressure)} pressure${trend ? `, ${TREND_TEXT[trend].toLowerCase()} over the next three hours` : ''}.`
      }
    >
      <svg viewBox="-12 -14 144 100" className={styles.sunArc} aria-hidden="true">
        <path
          d={`M ${CENTER - RADIUS} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS} ${CENTER}`}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${CENTER - RADIUS} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS} ${CENTER}`}
          fill="none"
          stroke="var(--chart-feels)"
          strokeWidth="9"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: f }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
        />
        {pressure !== null ? (
          <motion.circle
            r="5.5"
            fill="#fff"
            stroke="rgb(10 12 16 / 0.7)"
            strokeWidth="2"
            initial={{ cx: CENTER - RADIUS, cy: CENTER }}
            animate={{ cx: tip.x, cy: tip.y }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}
      </svg>
      <div className={styles.stack}>
        <span className={styles.value}>
          {pressure === null ? (
            <Value text={MISSING} />
          ) : (
            <>
              {Math.round(pressure)} <span className={styles.unit}>hPa</span>
            </>
          )}
        </span>
        {trend ? (
          <span className={styles.trend}>
            <TrendIcon size={15} aria-hidden="true" /> {TREND_TEXT[trend]}
          </span>
        ) : null}
      </div>
    </Widget>
  )
}
