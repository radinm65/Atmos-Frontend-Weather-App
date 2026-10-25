import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { createFakeSource } from '../../test/fakeSource'
import { renderApp } from '../../test/render'
import { ACTIVE_LOCATION_KEY } from '../locations/activeLocationStorage'

// Recharts needs real element sizes, which jsdom lacks; its data helpers are tested separately.
vi.mock('./ForecastExplorer', () => ({
  default: () => <div data-testid="explorer" />,
}))

function saveActiveLocation() {
  window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
}

describe('forecast page', () => {
  it('shows the place, hourly strip, outlook list and the chart explorer', async () => {
    saveActiveLocation()
    renderApp('/forecast', { source: createFakeSource().source })

    expect(await screen.findByRole('heading', { level: 1, name: 'Forecast' })).toBeInTheDocument()
    expect(screen.getByText('Berlin, State of Berlin, Germany')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /Next \d+ hours/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '3-day forecast' })).toBeInTheDocument()
    expect(await screen.findByTestId('explorer')).toBeInTheDocument()
  })

  it('offers the numbers as accessible tables in the location time zone, behind a disclosure', async () => {
    saveActiveLocation()
    renderApp('/forecast', { source: createFakeSource().source })

    await screen.findByRole('heading', { level: 1, name: 'Forecast' })
    await userEvent.click(await screen.findByText('Show data tables'))

    expect(screen.getByRole('columnheader', { name: 'Time (Europe/Berlin)' })).toBeInTheDocument()
    const daily = screen.getByRole('table', { name: 'Daily forecast for Berlin' })
    const rows = within(daily).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Sat 24 Oct')
    expect(rows[1]).toHaveTextContent('Light rain')
    expect(rows[1]).toHaveTextContent('12°C')
    expect(rows[1]).toHaveTextContent('7°C')
    expect(rows[1]).toHaveTextContent('88%')
    expect(rows[1]).toHaveTextContent('1.2 mm')
    // The third day has no values: they must read as unavailable, not as 0.
    expect(rows[3]).toHaveTextContent('Mon 26 Oct')
    expect(within(rows[3]!).getAllByText('not available').length).toBeGreaterThanOrEqual(4)
  })

  it('prompts for a location when none is chosen', async () => {
    renderApp('/forecast', { source: createFakeSource().source })
    expect(await screen.findByRole('heading', { name: 'Choose a location' })).toBeInTheDocument()
  })
})
