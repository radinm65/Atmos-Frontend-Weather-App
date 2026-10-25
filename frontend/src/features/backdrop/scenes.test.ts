import { describe, expect, it } from 'vitest'
import type { ConditionCategory } from '../../domain/weather'
import { SCENE_IDS, defaultScene, isBrightScene, sceneFiles, sceneFor } from './scenes'

describe('sceneFor', () => {
  it('maps each category to its own footage by day', () => {
    expect(sceneFor('clear', true)).toBe('clear-day')
    expect(sceneFor('partly-cloudy', true)).toBe('partly-cloudy')
    expect(sceneFor('overcast', true)).toBe('overcast')
    expect(sceneFor('fog', true)).toBe('fog')
    expect(sceneFor('rain', true)).toBe('rain')
    expect(sceneFor('snow', true)).toBe('snow')
    expect(sceneFor('thunderstorm', true)).toBe('thunderstorm')
  })

  it('uses the starry night after dark for clear and partly cloudy skies', () => {
    expect(sceneFor('clear', false)).toBe('clear-night')
    expect(sceneFor('partly-cloudy', false)).toBe('clear-night')
  })

  it('keeps weather footage for precipitation and fog at night', () => {
    expect(sceneFor('rain', false)).toBe('rain')
    expect(sceneFor('snow', false)).toBe('snow')
  })

  it('treats an unknown day/night flag as day', () => {
    expect(sceneFor('clear', null)).toBe('clear-day')
  })

  it('uses a calm neutral scene for unknown conditions, never sun or storm', () => {
    expect(sceneFor('unknown', true)).toBe('overcast')
    expect(sceneFor('unknown', false)).toBe('overcast')
  })

  it('always returns one of the shipped scenes', () => {
    const categories: ConditionCategory[] = [
      'clear',
      'partly-cloudy',
      'overcast',
      'fog',
      'rain',
      'snow',
      'thunderstorm',
      'unknown',
    ]
    for (const category of categories) {
      for (const isDay of [true, false, null]) {
        expect(SCENE_IDS).toContain(sceneFor(category, isDay))
      }
    }
  })
})

describe('defaultScene', () => {
  it('follows the visitor clock before any weather is known', () => {
    expect(defaultScene(new Date(2026, 9, 24, 12))).toBe('partly-cloudy')
    expect(defaultScene(new Date(2026, 9, 24, 23))).toBe('clear-night')
    expect(defaultScene(new Date(2026, 9, 24, 3))).toBe('clear-night')
  })
})

describe('scene files', () => {
  it('points at the video and poster for a scene', () => {
    expect(sceneFiles('rain', '/')).toEqual({
      video: '/backdrops/rain.mp4',
      poster: '/backdrops/rain.jpg',
    })
  })

  it('knows which footage is already dark', () => {
    expect(isBrightScene('clear-day')).toBe(true)
    expect(isBrightScene('clear-night')).toBe(false)
    expect(isBrightScene('thunderstorm')).toBe(false)
  })
})
