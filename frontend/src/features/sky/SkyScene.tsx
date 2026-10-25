import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { usePageVisible } from '../../hooks/usePageVisible'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { Clouds } from './Clouds'
import { Lightning } from './Lightning'
import { Precipitation } from './Precipitation'
import styles from './SkyScene.module.css'
import type { SkyState } from './skyState'
import { Stars } from './Stars'

export interface SkySceneProps {
  state: SkyState
  className?: string
}

/**
 * The live sky (DESIGN_SPEC §9a). Purely decorative and hidden from assistive technology: the
 * condition, temperature and time are always stated in text elsewhere on the page. It fills its
 * parent, which must be `position: relative` with a size.
 */
export function SkyScene({ state, className }: SkySceneProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const pageVisible = usePageVisible()
  const { colors, sun, moon, precipitation } = state

  // Gentle pointer parallax. Skipped for reduced motion and touch.
  useEffect(() => {
    const element = rootRef.current
    if (!element || reducedMotion) return
    let frame = 0
    let x = 0
    let y = 0
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const box = element.getBoundingClientRect()
      x = ((event.clientX - box.left) / box.width - 0.5) * 2
      y = ((event.clientY - box.top) / box.height - 0.5) * 2
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        element.style.setProperty('--px', x.toFixed(3))
        element.style.setProperty('--py', y.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [reducedMotion])

  const style = {
    '--sky-top': colors.top,
    '--sky-middle': colors.middle,
    '--sky-bottom': colors.bottom,
    '--sky-glow': colors.glow,
    '--sky-cloud': colors.cloud,
    '--sky-cloud-shade': colors.cloudShade,
    '--sky-hill-far': colors.hillFar,
    '--sky-hill-near': colors.hillNear,
    '--sun-x': sun.x,
    '--sun-y': sun.y,
    '--moon-x': moon.x,
    '--moon-y': moon.y,
  } as CSSProperties

  const animating = pageVisible && !reducedMotion
  const showPrecipitation = precipitation.kind !== 'none'

  return (
    <div
      ref={rootRef}
      className={[styles.sky, className].filter(Boolean).join(' ')}
      style={style}
      aria-hidden="true"
      data-condition={state.condition}
      data-night={state.altitude < 0 ? 'true' : 'false'}
    >
      <div className={styles.gradient} />
      <div className={styles.horizonGlow} style={{ opacity: 1 - Math.abs(state.altitude) * 1.4 }} />

      <div className={`${styles.layer} ${styles.layerStars}`} style={{ opacity: state.stars }}>
        <Stars />
      </div>

      <div className={`${styles.layer} ${styles.layerBodies}`}>
        <div className={styles.sun} style={{ opacity: sun.visible }} />
        <div className={styles.moon} style={{ opacity: moon.visible }} />
      </div>

      <div className={`${styles.layer} ${styles.layerClouds}`}>
        <Clouds amount={state.cloudAmount} drift={state.windDrift} />
      </div>

      {state.fog > 0 ? (
        <div className={styles.fog} style={{ opacity: state.fog }}>
          <div className={styles.fogBand} />
          <div className={`${styles.fogBand} ${styles.fogBandSlow}`} />
        </div>
      ) : null}

      {showPrecipitation && animating ? (
        <Precipitation
          kind={precipitation.kind === 'snow' ? 'snow' : 'rain'}
          intensity={precipitation.intensity}
          wind={state.windDrift}
          paused={!animating}
        />
      ) : null}
      {showPrecipitation && reducedMotion ? (
        <div
          className={styles.staticPrecipitation}
          data-kind={precipitation.kind}
          style={{ opacity: 0.25 + precipitation.intensity * 0.35 }}
        />
      ) : null}

      <Lightning active={state.lightning && animating} />

      <svg
        className={`${styles.layer} ${styles.layerHills}`}
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
      >
        <path
          className={styles.hillFar}
          d="M0 120 C160 70 300 150 480 110 C660 70 760 40 960 90 C1140 135 1280 80 1440 105 L1440 220 L0 220 Z"
        />
        <path
          className={styles.hillNear}
          d="M0 170 C200 130 340 190 560 160 C760 130 900 175 1100 150 C1260 130 1360 160 1440 150 L1440 220 L0 220 Z"
        />
      </svg>
    </div>
  )
}
