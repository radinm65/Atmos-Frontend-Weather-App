import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { renderWithProviders } from '../../test/render'
import { ACTIVE_LOCATION_KEY, loadActiveLocation } from './activeLocationStorage'
import { useActiveLocation } from './useActiveLocation'

function Probe() {
  const { activeLocation, setActiveLocation, clearActiveLocation } = useActiveLocation()
  return (
    <div>
      <p data-testid="name">{activeLocation?.name ?? 'none'}</p>
      <button type="button" onClick={() => setActiveLocation(berlin)}>
        set
      </button>
      <button type="button" onClick={clearActiveLocation}>
        clear
      </button>
    </div>
  )
}

describe('ActiveLocationProvider', () => {
  it('starts with no location', () => {
    renderWithProviders(<Probe />)
    expect(screen.getByTestId('name')).toHaveTextContent('none')
  })

  it('persists the selection and restores it on the next load', async () => {
    const first = renderWithProviders(<Probe />)
    await userEvent.click(screen.getByText('set'))
    expect(screen.getByTestId('name')).toHaveTextContent('Berlin')
    expect(loadActiveLocation()).toEqual(berlin)
    first.unmount()

    renderWithProviders(<Probe />)
    expect(screen.getByTestId('name')).toHaveTextContent('Berlin')
  })

  it('clears the saved location', async () => {
    window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(berlin))
    renderWithProviders(<Probe />)
    await userEvent.click(screen.getByText('clear'))
    expect(screen.getByTestId('name')).toHaveTextContent('none')
    expect(window.localStorage.getItem(ACTIVE_LOCATION_KEY)).toBeNull()
  })

  it.each([
    ['not JSON', '{oops'],
    ['wrong shape', JSON.stringify({ name: 'Berlin' })],
    ['out-of-range coordinates', JSON.stringify({ ...berlin, latitude: 999 })],
    ['a bare string', JSON.stringify('Berlin')],
  ])('ignores invalid stored data (%s) without crashing', (_label, stored) => {
    window.localStorage.setItem(ACTIVE_LOCATION_KEY, stored)
    renderWithProviders(<Probe />)
    expect(screen.getByTestId('name')).toHaveTextContent('none')
  })
})
