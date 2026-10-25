import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { clamp } from '../../lib/math'
import styles from './RingGauge.module.css'

export interface RingGaugeProps {
  /** 0–1 fill. */
  fraction: number
  /** Stroke colour, any CSS colour or `var(--token)`. */
  color: string
  size?: number
  stroke?: number
  /** Content centred in the ring (the numeric value). */
  children?: ReactNode
}

/** An animated progress ring. Decorative: the value it shows is always in the centre as text. */
export function RingGauge({ fraction, color, size = 132, stroke = 11, children }: RingGaugeProps) {
  const radius = (size - stroke) / 2
  const center = size / 2
  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: clamp(fraction) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  )
}
