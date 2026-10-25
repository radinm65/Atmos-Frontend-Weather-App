import { Droplets } from 'lucide-react'
import { AnimatedNumber } from '../../../components/motion/AnimatedNumber'
import { RingGauge } from '../../../components/ui/RingGauge'
import { Value } from '../../../components/ui/Value'
import type { WeatherReport } from '../../../domain/weather'
import { MISSING, formatTemperature } from '../../../lib/formatting'
import { useUnits } from '../../preferences/useUnits'
import { describeHumidity } from '../../weather/describe'
import { Widget } from '../Widget'
import styles from './widgets.module.css'

export function HumidityWidget({ report }: { report: WeatherReport }) {
  const units = useUnits()
  const { humidity, dewPoint } = report.current

  return (
    <Widget
      title="Humidity"
      icon={Droplets}
      note={
        humidity === null
          ? 'Humidity is not available.'
          : `${describeHumidity(humidity)}. The dew point is ${formatTemperature(dewPoint, units.temperature)}.`
      }
    >
      <RingGauge fraction={(humidity ?? 0) / 100} color="var(--chart-rain)">
        {humidity === null ? (
          <span className={styles.value}>
            <Value text={MISSING} />
          </span>
        ) : (
          <span className={styles.value}>
            <AnimatedNumber value={humidity} format={(n) => `${Math.round(n)}%`} />
          </span>
        )}
      </RingGauge>
    </Widget>
  )
}
