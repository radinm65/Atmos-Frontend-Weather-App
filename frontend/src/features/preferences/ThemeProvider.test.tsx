import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY } from './theme'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'

function mockSystemTheme(prefersLight: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('light') ? prefersLight : !prefersLight,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  )
}

function renderProbe() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
})

describe('ThemeProvider', () => {
  it('follows a light system preference when nothing is stored', () => {
    mockSystemTheme(true)
    renderProbe()
    expect(screen.getByRole('button')).toHaveTextContent('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('follows a dark system preference when nothing is stored', () => {
    mockSystemTheme(false)
    renderProbe()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('falls back to dark when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    renderProbe()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('prefers the stored theme over the system preference', () => {
    mockSystemTheme(true)
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify('dark'))
    renderProbe()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('ignores an invalid stored value', () => {
    mockSystemTheme(false)
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify('purple'))
    renderProbe()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('toggles the theme and persists the choice', async () => {
    mockSystemTheme(false)
    renderProbe()
    await userEvent.click(screen.getByRole('button'))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('"light"')
  })
})
