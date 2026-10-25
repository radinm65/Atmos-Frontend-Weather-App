import { CloudRain, Pause, Play } from 'lucide-react'
import { useId } from 'react'
import { Button } from '../../components/ui/Button'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { formatAge, formatTime } from '../../lib/formatting'
import styles from './RadarControls.module.css'
import type { RadarFrame } from './rainViewer'

export interface RadarControlsProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  /** The radar timeline request. */
  state: 'loading' | 'error' | 'ready'
  onRetry: () => void
  frames: readonly RadarFrame[]
  frame: RadarFrame | null
  onFrameChange: (time: string) => void
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  opacity: number
  onOpacityChange: (opacity: number) => void
  /** Some radar tiles of the current frame failed to load. */
  tilesFailed: boolean
}

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

/**
 * Radar layer controls: on/off, time, play, opacity. Times are shown in the viewer's own zone,
 * because the radar is a picture of the sky at one moment, not of one place.
 */
export function RadarControls({
  enabled,
  onEnabledChange,
  state,
  onRetry,
  frames,
  frame,
  onFrameChange,
  playing,
  onPlayingChange,
  opacity,
  onOpacityChange,
  tilesFailed,
}: RadarControlsProps) {
  const id = useId()
  const zone = browserTimeZone()
  const index = frame ? frames.findIndex((item) => item.time === frame.time) : -1
  const timeLabel = frame ? formatTime(frame.time, zone) : ''
  const ageLabel = frame ? formatAge(frame.time) : ''

  return (
    <GlassPanel
      as="section"
      interactive={false}
      className={styles.panel}
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.top}>
        <h2 id={`${id}-title`} className={styles.title}>
          <CloudRain size={18} aria-hidden="true" /> Rain radar
        </h2>
        <label className={styles.switch}>
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          <span className={styles.track} aria-hidden="true" />
          <span className="visually-hidden">Show rain radar on the map</span>
        </label>
      </div>

      {!enabled ? (
        <p className={styles.note}>Turn the radar on to see where it is raining right now.</p>
      ) : state === 'loading' ? (
        <p role="status" className={styles.note}>
          Loading radar…
        </p>
      ) : state === 'error' || !frame ? (
        <div role="alert" className={styles.problem}>
          <p>The rain radar is not available right now. The map still works.</p>
          <Button variant="secondary" onClick={onRetry}>
            Try radar again
          </Button>
        </div>
      ) : (
        <>
          <p className={styles.time}>
            <strong>{timeLabel}</strong> <span>your time · {ageLabel}</span>
          </p>

          <div className={styles.row}>
            <Button
              variant="secondary"
              aria-pressed={playing}
              onClick={() => onPlayingChange(!playing)}
            >
              {playing ? (
                <Pause size={16} aria-hidden="true" />
              ) : (
                <Play size={16} aria-hidden="true" />
              )}
              {playing ? 'Pause' : 'Play'}
            </Button>
            <div className={styles.field}>
              <label htmlFor={`${id}-time`} className={styles.label}>
                Radar time
              </label>
              <input
                id={`${id}-time`}
                type="range"
                min={0}
                max={Math.max(0, frames.length - 1)}
                step={1}
                value={Math.max(0, index)}
                aria-valuetext={`${timeLabel}, ${ageLabel}`}
                onChange={(event) => {
                  const next = frames[Number(event.target.value)]
                  if (next) onFrameChange(next.time)
                }}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor={`${id}-opacity`} className={styles.label}>
              Radar strength
            </label>
            <input
              id={`${id}-opacity`}
              type="range"
              min={30}
              max={100}
              step={5}
              value={Math.round(opacity * 100)}
              aria-valuetext={`${Math.round(opacity * 100)} percent`}
              onChange={(event) => onOpacityChange(Number(event.target.value) / 100)}
            />
          </div>

          {tilesFailed ? (
            <p role="status" className={styles.warning}>
              Some radar tiles did not load. The radar service may be busy; pause playback and try
              again in a minute.
            </p>
          ) : null}
        </>
      )}

      <p className={styles.note}>
        Past radar only (about the last two hours, in 10-minute steps), not a forecast. Stronger
        colour means heavier precipitation.
      </p>
      <p className={styles.credit}>
        Radar by{' '}
        <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">
          RainViewer
        </a>
        . Map © OpenStreetMap contributors.
      </p>
    </GlassPanel>
  )
}
