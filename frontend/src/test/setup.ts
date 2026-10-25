import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// Route chunks (motion, react-icons, charts) can take a moment to load on a busy machine.
configure({ asyncUtilTimeout: 5000 })

// jsdom does not implement media playback and logs "not implemented" for play()/pause().
HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLMediaElement.prototype.pause = () => undefined

// jsdom has no ResizeObserver.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoopResizeObserver

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
