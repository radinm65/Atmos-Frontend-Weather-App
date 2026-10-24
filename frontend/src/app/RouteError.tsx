import { useRouteError } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState'

/** Rendered inside the shell when a route fails to load or throws, so navigation stays usable. */
export function RouteError() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)
  return (
    <ErrorState
      message="This page failed to load. Check your connection and try again."
      onRetry={() => window.location.reload()}
    />
  )
}
