import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ActiveLocationProvider } from '../features/locations/ActiveLocationProvider'
import { SavedLocationsProvider } from '../features/locations/SavedLocationsProvider'
import { PreferencesProvider } from '../features/preferences/PreferencesProvider'
import { ThemeProvider } from '../features/preferences/ThemeProvider'
import { WeatherDataSourceContext } from '../features/weather/WeatherDataSourceContext'
import { createDataSource } from '../lib/api'
import type { WeatherDataSource } from '../lib/api'
import { readConfig } from '../lib/config/env'
import { createQueryClient } from '../lib/query/queryClient'

export interface ProvidersProps {
  children: ReactNode
  /** Tests inject these; the app creates them from configuration. */
  dataSource?: WeatherDataSource
  queryClient?: QueryClient
}

/**
 * App-wide providers: theme, motion preferences, server-state cache, the configured data source,
 * and the active location. `reducedMotion="user"` makes every animation respect the OS setting.
 */
export function Providers({ children, dataSource, queryClient }: ProvidersProps) {
  const [source] = useState(() => dataSource ?? createDataSource(readConfig()))
  const [client] = useState(() => queryClient ?? createQueryClient())

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={client}>
          <WeatherDataSourceContext.Provider value={source}>
            <PreferencesProvider>
              <ActiveLocationProvider>
                <SavedLocationsProvider>{children}</SavedLocationsProvider>
              </ActiveLocationProvider>
            </PreferencesProvider>
          </WeatherDataSourceContext.Provider>
        </QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  )
}
