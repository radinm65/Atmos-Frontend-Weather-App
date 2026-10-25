import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { seededRandom } from './random'
import styles from './SkyScene.module.css'

const MAX_CLOUDS = 9

interface CloudSpec {
  /** Vertical position, % of the sky. */
  top: number
  /** Horizontal start for the static (reduced-motion) layout, %. */
  x: number
  width: number
  height: number
  /** Relative drift speed; nearer (lower, bigger) clouds move faster. */
  speed: number
  /** Where in the drift cycle it starts, 0–1. */
  phase: number
  opacity: number
}

const BASE_DURATION_S = 150
const FAST_DURATION_S = 55

export interface CloudsProps {
  /** 0–1: how much of the sky is cloud. */
  amount: number
  /** 0–1: drift speed. */
  drift: number
}

/** Soft drifting clouds made of layered gradients (no images, no filters). */
export function Clouds({ amount, drift }: CloudsProps) {
  const specs = useMemo<CloudSpec[]>(() => {
    const random = seededRandom(7)
    return Array.from({ length: MAX_CLOUDS }, (_, index) => {
      const depth = random()
      return {
        top: 6 + depth * 46 + (index % 3) * 4,
        x: random() * 90,
        width: 24 + depth * 26,
        height: 10 + depth * 12,
        speed: 0.6 + depth * 0.8,
        phase: random(),
        opacity: 0.55 + random() * 0.45,
      }
    })
  }, [])

  const count = Math.round(amount * MAX_CLOUDS)
  const seconds = BASE_DURATION_S - (BASE_DURATION_S - FAST_DURATION_S) * drift

  return (
    <div className={styles.clouds} style={{ opacity: Math.min(1, 0.3 + amount * 0.9) }}>
      {specs.slice(0, count).map((cloud, index) => {
        const duration = seconds / cloud.speed
        const style = {
          top: `${cloud.top}%`,
          width: `${cloud.width}%`,
          height: `${cloud.height}%`,
          opacity: cloud.opacity,
          animationDuration: `${duration}s`,
          animationDelay: `${-cloud.phase * duration}s`,
          '--cloud-x': `${cloud.x}%`,
        } as CSSProperties
        return <div key={index} className={styles.cloud} style={style} />
      })}
      {/* A low veil joins the clouds into one overcast layer when the sky is mostly covered. */}
      <div className={styles.veil} style={{ opacity: Math.max(0, amount - 0.55) * 1.6 }} />
    </div>
  )
}
