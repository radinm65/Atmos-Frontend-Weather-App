import { motion } from 'motion/react'
import { Wind } from 'lucide-react'
import { AnimatedNumber } from '../../../components/motion/AnimatedNumber'
import { Value } from '../../../components/ui/Value'
import type { WeatherReport } from '../../../domain/weather'
import { MISSING, convertWindSpeed, formatWindSpeed } from '../../../lib/formatting'
import { compassDirection, describeWind } from '../../weather/describe'
import { useUnits } from '../../preferences/useUnits'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

const CARDINALS: readonly (readonly [string, number])[] = [
  ['N', 0],
  ['E', 90],
  ['S', 180],
  ['W', 270],
]

function polar(degrees: number, radius: number): { x: number; y: number } {
  const radians = ((degrees - 90) * Math.PI) / 180
  return { x: 60 + radius * Math.cos(radians), y: 60 + radius * Math.sin(radians) }
}

export function WindWidget({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const { windSpeed, windGusts, windDirection } = report.current
  const unitLabel = units.windSpeed === 'mph' ? 'mph' : 'km/h'
  // Wind direction is where it blows FROM; the arrow points the way it is going.
  const arrowAngle = windDirection === null ? null : (windDirection + 180) % 360

  return (
    <Widget
      title="Wind"
      icon={Wind}
      note={
        windSpeed === null
          ? 'Wind speed is not available.'
          : `${describeWind(windSpeed)}${windDirection === null ? '' : `, from the ${compassDirection(windDirection)}`}.${windGusts === null ? '' : ` Gusts up to ${formatWindSpeed(windGusts, units.windSpeed)}.`}`
      }
    >
      <svg viewBox="0 0 120 120" className={styles.compass} aria-hidden="true">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-track)" strokeWidth="2" />
        {Array.from({ length: 36 }, (_, i) => {
          const major = i % 9 === 0
          const a = polar(i * 10, major ? 46 : 50)
          const b = polar(i * 10, 54)
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--color-text-muted)"
              strokeWidth={major ? 2 : 1}
              opacity={major ? 0.9 : 0.4}
            />
          )
        })}
        {CARDINALS.map(([letter, degrees]) => {
          const p = polar(degrees, 36)
          return (
            <text
              key={letter}
              x={p.x}
              y={p.y}
              fill="var(--color-text-muted)"
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {letter}
            </text>
          )
        })}
        {arrowAngle !== null ? (
          <motion.g
            initial={{ rotate: arrowAngle - 140 }}
            animate={{ rotate: arrowAngle }}
            transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            style={{ transformOrigin: '60px 60px' }}
          >
            <path d="M60 24 L66 60 L60 54 L54 60 Z" fill="var(--color-accent)" />
            <path d="M60 96 L66 60 L60 66 L54 60 Z" fill="var(--color-text-muted)" opacity="0.55" />
            <circle cx="60" cy="60" r="3.5" fill="var(--color-text)" />
          </motion.g>
        ) : null}
      </svg>
      <div className={styles.stack}>
        {windSpeed === null ? (
          <span className={styles.value}>
            <Value text={MISSING} />
          </span>
        ) : (
          <>
            <span className={styles.value}>
              <AnimatedNumber
                value={convertWindSpeed(windSpeed, units.windSpeed)}
                format={(n) => String(Math.round(n))}
              />
              <span className={styles.unit}>{unitLabel}</span>
            </span>
          </>
        )}
      </div>
    </Widget>
  )
}
