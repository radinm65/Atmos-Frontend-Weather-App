import { motion } from 'motion/react'
import { Eye } from 'lucide-react'
import { Value } from '../../../components/ui/Value'
import type { WeatherReport } from '../../../domain/weather'
import { MISSING, formatDistance } from '../../../lib/formatting'
import { describeVisibility } from '../../weather/describe'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

export function VisibilityWidget({ report }: { report: WeatherReport }) {
  const { visibility } = report.current
  const level = visibility === null ? null : describeVisibility(visibility)

  return (
    <Widget
      title="Visibility"
      icon={Eye}
      note={level ? `${level.label} visibility.` : 'Visibility is not available.'}
    >
      <div className={styles.stack}>
        <span className={styles.value}>
          <Value text={visibility === null ? MISSING : formatDistance(visibility)} />
        </span>
        <span className={styles.label}>{level?.label ?? 'Unknown'}</span>
      </div>
      <div className={`${styles.scale} ${styles.scaleVisibility}`}>
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
