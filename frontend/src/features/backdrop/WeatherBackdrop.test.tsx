import { fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WeatherBackdrop } from './WeatherBackdrop'

function stubMotionPreference(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('reduce') ? reduced : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('WeatherBackdrop', () => {
  it('plays a muted, looping video for the scene, with its poster, hidden from assistive tech', () => {
    stubMotionPreference(false)
    const { container } = render(<WeatherBackdrop scene="rain" />)

    const root = container.firstElementChild
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root).toHaveAttribute('data-scene', 'rain')

    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    expect(video?.getAttribute('src')).toBe('/backdrops/rain.mp4')
    expect(video?.getAttribute('poster')).toBe('/backdrops/rain.jpg')
    expect(video?.muted).toBe(true)
    expect(video?.loop).toBe(true)
    expect(video?.hasAttribute('controls')).toBe(false)
  })

  it('shows only the still poster, with no video, for reduced motion', () => {
    stubMotionPreference(true)
    const { container } = render(<WeatherBackdrop scene="snow" />)
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/backdrops/snow.jpg')
  })

  it('falls back to the poster if the video fails to load', () => {
    stubMotionPreference(false)
    const { container } = render(<WeatherBackdrop scene="fog" />)
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    fireEvent.error(video as HTMLVideoElement)
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/backdrops/fog.jpg')
  })

  it('shows only the poster when the browser asks to save data', () => {
    stubMotionPreference(false)
    vi.stubGlobal('navigator', { ...navigator, connection: { saveData: true } })
    const { container } = render(<WeatherBackdrop scene="overcast" />)
    expect(container.querySelector('video')).toBeNull()
    expect(container.querySelector('img')).not.toBeNull()
  })
})
