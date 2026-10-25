import { useEffect, useState } from 'react'
import styles from './SkyScene.module.css'

const MIN_GAP_MS = 4000
const MAX_GAP_MS = 11000

/**
 * Occasional soft sheet-lightning. Flashes are infrequent (every 4–11 s), dim, and never
 * strobe; the parent turns this off entirely for reduced motion and hidden tabs.
 */
export function Lightning({ active }: { active: boolean }) {
  const [flashKey, setFlashKey] = useState(0)

  useEffect(() => {
    if (!active) return
    let timer: number
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setFlashKey((key) => key + 1)
          schedule()
        },
        MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS),
      )
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [active])

  if (!active || flashKey === 0) return null
  // Re-keying restarts the CSS animation for each flash.
  return <div key={flashKey} className={styles.lightning} />
}
