import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'

// jsdom has no canvas and logs a "not implemented" error on every getContext call. The sky's
// precipitation layer is written to cope with a missing context, so return null quietly.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext
})

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
