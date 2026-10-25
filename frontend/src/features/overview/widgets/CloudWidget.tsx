import { Cloud } from 'lucide-react'
import { AnimatedNumber } from '../../../components/motion/AnimatedNumber'
import { RingGauge } from '../../../components/ui/RingGauge'
import { Value } from '../../../components/ui/Value'
import type { WeatherReport } from '../../../domain/weather'
import { MISSING } from '../../../lib/formatting'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

function describeCover(percent: number): string {
  if (percent < 12) return 'Clear skies'
  if (percent < 40) return 'Mostly clear'
  if (percent < 70) return 'Partly cloudy'
  if (percent < 90) return 'Mostly cloudy'
  return 'Overcast'
}

export function CloudWidget({ report }: { report: WeatherReport }) {
  const { cloudCover } = report.current

  return (
    <Widget
      title="Cloud cover"
      icon={Cloud}
      note={cloudCover === null ? 'Cloud cover is not available.' : `${describeCover(cloudCover)}.`}
    >
      <RingGauge fraction={(cloudCover ?? 0) / 100} color="var(--color-text)">
        {cloudCover === null ? (
          <span className={styles.value}>
            <Value text={MISSING} />
          </span>
        ) : (
          <span className={styles.value}>
            <AnimatedNumber value={cloudCover} format={(n) => `${Math.round(n)}%`} />
          </span>
        )}
      </RingGauge>
    </Widget>
  )
}
