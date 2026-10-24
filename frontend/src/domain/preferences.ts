export type Theme = 'light' | 'dark'

export const THEMES: readonly Theme[] = ['light', 'dark']

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}
