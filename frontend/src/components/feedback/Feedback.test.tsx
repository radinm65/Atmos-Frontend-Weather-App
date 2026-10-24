import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

describe('LoadingState', () => {
  it('announces a status label', () => {
    render(<LoadingState label="Loading forecast" />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading forecast')
  })
})

describe('EmptyState', () => {
  it('renders title, description and action', () => {
    render(
      <EmptyState
        title="No saved locations"
        description="Search for a city to add one."
        action={<button type="button">Search</button>}
      />,
    )
    expect(screen.getByRole('heading', { name: 'No saved locations' })).toBeInTheDocument()
    expect(screen.getByText('Search for a city to add one.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('shows the message as an alert without a retry button by default', () => {
    render(<ErrorState message="The weather service is unavailable." />)
    expect(screen.getByRole('alert')).toHaveTextContent('The weather service is unavailable.')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRetry when the retry button is pressed', async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Failed." onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
