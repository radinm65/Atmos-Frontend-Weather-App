import type { ConditionCategory } from '../../domain/weather'

/**
 * The weather → backdrop mapping (DESIGN_SPEC §9). One real looping video per scene, stored in
 * `public/backdrops/` with a poster frame. Components never choose files themselves.
 * Credits for every clip are in docs/CREDITS.md.
 */
export type SceneId =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunderstorm'

export const SCENE_IDS: readonly SceneId[] = [
  'clear-day',
  'clear-night',
  'partly-cloudy',
  'overcast',
  'fog',
  'rain',
  'snow',
  'thunderstorm',
]

/** The footage shows the weather category; it is never a view of the actual place. */
export function sceneFor(category: ConditionCategory, isDay: boolean | null): SceneId {
  const night = isDay === false
  switch (category) {
    case 'clear':
      return night ? 'clear-night' : 'clear-day'
    case 'partly-cloudy':
      // No cloudy-night clip: a starry sky is the honest closest match after dark.
      return night ? 'clear-night' : 'partly-cloudy'
    case 'overcast':
      return 'overcast'
    case 'fog':
      return 'fog'
    case 'rain':
      return 'rain'
    case 'snow':
      return 'snow'
    case 'thunderstorm':
      return 'thunderstorm'
    case 'unknown':
      // Neutral and calm: unknown weather should not look sunny or stormy.
      return 'overcast'
  }
}

/** Scene before any weather is known (first run): follows the visitor's own clock. */
export function defaultScene(now: Date = new Date()): SceneId {
  const hour = now.getHours()
  return hour >= 6 && hour < 19 ? 'partly-cloudy' : 'clear-night'
}

/** Whether the scene's footage is bright daylight (used to dim it after dark). */
export function isBrightScene(scene: SceneId): boolean {
  return scene !== 'clear-night' && scene !== 'thunderstorm'
}

export interface SceneFiles {
  video: string
  poster: string
}

export function sceneFiles(scene: SceneId, base: string = import.meta.env.BASE_URL): SceneFiles {
  return { video: `${base}backdrops/${scene}.mp4`, poster: `${base}backdrops/${scene}.jpg` }
}
