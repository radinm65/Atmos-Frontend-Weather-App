import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render'
import { loadActiveLocation } from './activeLocationStorage'
import { LocationPicker } from './LocationPicker'

function renderPicker() {
  return renderWithProviders(
    <MemoryRouter>
      <LocationPicker />
    </MemoryRouter>,
  )
}

function stubGeolocation(getCurrentPosition: Geolocation['getCurrentPosition']) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition } satisfies Partial<Geolocation>,
  })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation')
})

describe('LocationPicker', () => {
  it('invites the user to choose a location first', () => {
    renderPicker()
    expect(screen.getByRole('button', { name: /choose location/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('opens a search panel, picks a place, persists it and returns focus', async () => {
    renderPicker()
    const trigger = screen.getByRole('button', { name: /choose location/i })
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('combobox', { name: 'Search for a city' })).toHaveFocus()

    await userEvent.keyboard('berlin')
    await userEvent.click((await screen.findAllByRole('option'))[0]!)

    expect(loadActiveLocation()?.id).toBe('om:2950159')
    const updated = screen.getByRole('button', { name: /berlin/i })
    expect(updated).toHaveAttribute('aria-expanded', 'false')
    expect(updated).toHaveFocus()
  })

  it('closes with Escape and returns focus to the trigger', async () => {
    renderPicker()
    const trigger = screen.getByRole('button', { name: /choose location/i })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('closes when clicking outside', async () => {
    renderPicker()
    const trigger = screen.getByRole('button', { name: /choose location/i })
    await userEvent.click(trigger)
    await userEvent.click(document.body)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Use my location', () => {
  it('is hidden when the browser has no geolocation', async () => {
    renderPicker()
    await userEvent.click(screen.getByRole('button', { name: /choose location/i }))
    expect(screen.queryByRole('button', { name: /use my location/i })).not.toBeInTheDocument()
  })

  it('never asks for the position until pressed, then stores a rounded location', async () => {
    const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>((success) =>
      success({ coords: { latitude: 52.52437, longitude: 13.41053 } } as GeolocationPosition),
    )
    stubGeolocation(getCurrentPosition)
    renderPicker()
    await userEvent.click(screen.getByRole('button', { name: /choose location/i }))
    expect(getCurrentPosition).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /use my location/i }))
    expect(getCurrentPosition).toHaveBeenCalledOnce()
    expect(loadActiveLocation()).toEqual({
      id: 'geo:52.52,13.41',
      name: 'My location',
      latitude: 52.52,
      longitude: 13.41,
    })
  })

  it('explains a denied permission and keeps the picker usable', async () => {
    stubGeolocation((_success, error) =>
      error?.({ code: 1, PERMISSION_DENIED: 1, TIMEOUT: 3 } as GeolocationPositionError),
    )
    renderPicker()
    await userEvent.click(screen.getByRole('button', { name: /choose location/i }))
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/blocked/i)
    expect(loadActiveLocation()).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Search for a city' })).toBeInTheDocument()
  })
})
