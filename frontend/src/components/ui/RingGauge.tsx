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

/**
 * Room around the ring for its glow. The glow is a blur that spreads past the stroke; if the SVG
 * were exactly ring-sized it would be cut off in a visible square, so each layer is larger than
 * the ring and allowed to overflow.
 */
const GLOW_ROOM = 22

/** An animated progress ring. Decorative: the value it shows is always in the centre as text. */
export function RingGauge({ fraction, color, size = 132, stroke = 11, children }: RingGaugeProps) {
  const radius = (size - stroke) / 2
  const center = size / 2
  const box = size + GLOW_ROOM * 2
  const view = `${-GLOW_ROOM} ${-GLOW_ROOM} ${box} ${box}`
  const layer = { top: -GLOW_ROOM, left: -GLOW_ROOM, width: box, height: box }

  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg className={styles.layer} style={layer} viewBox={view} aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth={stroke}
        />
      </svg>
      {/* The glow is applied to this whole layer, which has room to spread. */}
      <svg
        className={styles.layer}
        style={{ ...layer, filter: `drop-shadow(0 0 8px ${color})` }}
        viewBox={view}
        aria-hidden="true"
      >
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
        />
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  )
}
