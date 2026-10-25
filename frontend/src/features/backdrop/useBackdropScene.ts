import { useState } from 'react'
import { useActiveLocation } from '../locations/useActiveLocation'
import { useWeather } from '../weather/useWeather'
import { defaultScene, isBrightScene, sceneFor } from './scenes'
import type { SceneId } from './scenes'

export interface BackdropState {
  scene: SceneId
  /** Bright daytime footage that should be dimmed because it is night at the location. */
  dim: boolean
}

/**
 * Chooses the backdrop from the active location's weather. It reads the same cached query as the
 * pages, so it costs no extra request. While weather loads or fails, the last scene stays.
 */
export function useBackdropScene(): BackdropState {
  const { activeLocation } = useActiveLocation()
  const { data } = useWeather(activeLocation)
  const [held, setHeld] = useState<BackdropState>(() => ({ scene: defaultScene(), dim: false }))

  let next: BackdropState | null = null
  if (data) {
    const { condition, isDay } = data.current
    const scene = sceneFor(condition.category, isDay)
    next = { scene, dim: isDay === false && isBrightScene(scene) }
  } else if (!activeLocation) {
    next = { scene: defaultScene(), dim: false }
  }

  // Remember the latest known scene (state derived during render, per React's guidance).
  if (next && (next.scene !== held.scene || next.dim !== held.dim)) setHeld(next)

  return next ?? held
}
