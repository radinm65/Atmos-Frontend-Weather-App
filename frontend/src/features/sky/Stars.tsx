import { useMemo } from 'react'
import { seededRandom } from './random'
import styles from './SkyScene.module.css'

const STAR_COUNT = 90

interface Star {
  x: number
  y: number
  r: number
  delay: number
  duration: number
}

/** A fixed field of stars in the upper sky. Visibility is controlled by the parent's opacity. */
export function Stars() {
  const stars = useMemo<Star[]>(() => {
    const random = seededRandom(42)
    return Array.from({ length: STAR_COUNT }, () => ({
      x: random() * 100,
      y: random() * 62,
      r: 0.5 + random() * 1.1,
      delay: random() * 6,
      duration: 2.5 + random() * 4,
    }))
  }, [])

  return (
    <svg className={styles.starsSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
      {stars.map((star, index) => (
        <circle
          key={index}
          className={styles.star}
          cx={star.x}
          cy={star.y}
          r={star.r * 0.18}
          style={{ animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s` }}
        />
      ))}
    </svg>
  )
}
