import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { usePageVisible } from '../../hooks/usePageVisible'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import styles from './WeatherBackdrop.module.css'
import { sceneFiles } from './scenes'
import type { SceneId } from './scenes'

export interface WeatherBackdropProps {
  scene: SceneId
  /** Dim daytime footage because it is night at the location. */
  dim?: boolean
}

interface NetworkInformationLike {
  saveData?: boolean
}

function prefersSavedData(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection
  return connection?.saveData === true
}

/** One full-screen scene: a muted looping video, or its still poster when video is not wanted. */
function SceneLayer({ scene, still, dim }: { scene: SceneId; still: boolean; dim: boolean }) {
  const { video, poster } = sceneFiles(scene)
  const ref = useRef<HTMLVideoElement>(null)
  const visible = usePageVisible()
  const [failed, setFailed] = useState(false)

  // Pause while the tab is hidden to save battery and bandwidth.
  useEffect(() => {
    const element = ref.current
    if (!element || still || failed) return
    if (visible) {
      // Older browsers return nothing from play(); autoplay can also be refused. Both are fine:
      // the poster stays visible.
      const attempt: Promise<void> | undefined = element.play()
      attempt?.catch(() => undefined)
    } else {
      element.pause()
    }
  }, [visible, still, failed])

  return (
    <motion.div
      className={styles.layer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: 'easeInOut' }}
      data-scene={scene}
    >
      {still || failed ? (
        <img className={`${styles.media} ${dim ? styles.dim : ''}`} src={poster} alt="" />
      ) : (
        <video
          ref={ref}
          className={`${styles.media} ${dim ? styles.dim : ''}`}
          src={video}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          onError={() => setFailed(true)}
        />
      )}
    </motion.div>
  )
}

/**
 * The full-screen live wallpaper behind the whole app (DESIGN_SPEC §9a). Purely decorative and
 * hidden from assistive technology; the weather is always also stated in text. Reduced motion
 * and "data saver" show the still poster instead of video.
 */
export function WeatherBackdrop({ scene, dim = false }: WeatherBackdropProps) {
  const reducedMotion = useReducedMotion()
  const still = reducedMotion || prefersSavedData()

  return (
    <div className={styles.backdrop} aria-hidden="true" data-scene={scene}>
      <AnimatePresence initial={false}>
        <SceneLayer key={scene} scene={scene} still={still} dim={dim} />
      </AnimatePresence>
      <div className={styles.scrim} />
      <div className={styles.vignette} />
    </div>
  )
}
