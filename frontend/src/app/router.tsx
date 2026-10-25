import { createBrowserRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { LoadingState } from '../components/feedback/LoadingState'
import { AppShell } from '../components/layout/AppShell'
import { NotFoundPage } from './NotFoundPage'
import { RouteError } from './RouteError'

/**
 * Feature pages are lazy-loaded so heavy routes (map, charts, assistant) stay out of the
 * initial bundle (TRD §9a). The pathless layout route keeps the shell mounted on route errors.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    hydrateFallbackElement: <LoadingState label="Loading Atmos" />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('../features/overview/OverviewPage')).OverviewPage,
            }),
          },
          {
            path: 'forecast',
            lazy: async () => ({
              Component: (await import('../features/forecast/ForecastPage')).ForecastPage,
            }),
          },
          {
            path: 'compare',
            lazy: async () => ({
              Component: (await import('../features/comparison/ComparePage')).ComparePage,
            }),
          },
          {
            path: 'map',
            lazy: async () => ({
              Component: (await import('../features/weather-map/MapPage')).MapPage,
            }),
          },
          {
            path: 'assistant',
            lazy: async () => ({
              Component: (await import('../features/assistant/AssistantPage')).AssistantPage,
            }),
          },
          {
            path: 'locations',
            lazy: async () => ({
              Component: (await import('../features/locations/LocationsPage')).LocationsPage,
            }),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
