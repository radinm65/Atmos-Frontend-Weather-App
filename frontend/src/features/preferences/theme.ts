import type { Theme } from '../../domain/preferences'
import { isTheme } from '../../domain/preferences'
import { readStorage, storageKey } from '../../lib/storage'

/**
 * NOTE: the inline script in index.html duplicates this key and the resolution rule so the
 * theme is applied before first paint. Keep the two in sync.
 */
export const THEME_STORAGE_KEY = storageKey('theme', 1)

const DEFAULT_THEME: Theme = 'dark'

export function getStoredTheme(): Theme | null {
  return readStorage(THEME_STORAGE_KEY, isTheme)
}

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DEFAULT_THEME
  }
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return DEFAULT_THEME
}

/** User's saved choice wins; otherwise follow the system preference; fall back to dark. */
export function resolveInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}
