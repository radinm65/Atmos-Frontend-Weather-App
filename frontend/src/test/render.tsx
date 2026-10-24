import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { Providers } from '../app/providers'
import { routes } from '../app/router'
import type { WeatherDataSource } from '../lib/api'
import { createFakeSource } from './fakeSource'

/** No retries, no caching between tests, so failures show up immediately and deterministically. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options: { source?: WeatherDataSource; queryClient?: QueryClient } = {},
) {
  const { source = createFakeSource().source, queryClient = createTestQueryClient() } = options
  return render(
    <Providers dataSource={source} queryClient={queryClient}>
      {ui}
    </Providers>,
  )
}

export function renderApp(
  path = '/',
  options: { source?: WeatherDataSource; queryClient?: QueryClient } = {},
) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return renderWithProviders(<RouterProvider router={router} />, options)
}
