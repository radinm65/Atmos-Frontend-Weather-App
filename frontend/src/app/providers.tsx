import type { ReactNode } from 'react'
import { ThemeProvider } from '../features/preferences/ThemeProvider'

/** App-wide providers. Server-state (TanStack Query) is added in Phase 2. */
export function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
