import { motion } from 'motion/react'
import { Sun } from 'lucide-react'
import { Value } from '../../../components/ui/Value'
import type { WeatherReport } from '../../../domain/weather'
import { MISSING, formatUv } from '../../../lib/formatting'
import { describeUv } from '../../weather/describe'
import { dailyForToday } from '../../weather/selectors'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

export function UvWidget({ report }: { report: WeatherReport }) {
  const { uvIndex } = report.current
  const max = dailyForToday(report)?.uvIndexMax ?? null
  const level = uvIndex === null ? null : describeUv(uvIndex)

  return (
    <Widget
      title="UV index"
      icon={Sun}
      note={
        level
          ? `${level.advice}${max === null ? '' : ` Today's peak: ${formatUv(max)}.`}`
          : 'The UV index is not available.'
      }
    >
      <div className={styles.stack}>
        <span className={styles.value}>
          <Value text={uvIndex === null ? MISSING : formatUv(uvIndex)} />
        </span>
        <span className={styles.label}>{level?.label ?? 'Unknown'}</span>
      </div>
      <div className={`${styles.scale} ${styles.scaleUv}`}>
        {level ? (
          <motion.span
            className={styles.marker}
            initial={{ left: '0%' }}
            animate={{ left: `${level.fraction * 100}%` }}
            transition={{ type: 'spring', stiffness: 70, damping: 14 }}
          />
        ) : null}
      </div>
    </Widget>
  )
}
