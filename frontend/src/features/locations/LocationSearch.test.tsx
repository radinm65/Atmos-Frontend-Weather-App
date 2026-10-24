import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WeatherApiError } from '../../lib/api'
import { berlin } from '../../lib/api/openMeteo/testFixtures'
import { berlinNewHampshire, createFakeSource } from '../../test/fakeSource'
import { renderWithProviders } from '../../test/render'
import { LocationSearch } from './LocationSearch'

function setup(sourceOverrides?: Parameters<typeof createFakeSource>[0]) {
  const fake = createFakeSource(sourceOverrides)
  const onSelect = vi.fn()
  renderWithProviders(<LocationSearch onSelect={onSelect} />, { source: fake.source })
  return { ...fake, onSelect, input: screen.getByRole('combobox', { name: 'Search for a city' }) }
}

describe('LocationSearch', () => {
  it('does not search until there are enough characters', async () => {
    const { input, searchLocations } = setup()
    await userEvent.type(input, 'b')
    expect(await screen.findByText(/at least 2 letters/i)).toBeInTheDocument()
    expect(searchLocations).not.toHaveBeenCalled()
  })

  it('shows results that tell similarly named places apart', async () => {
    const { input, searchLocations } = setup()
    await userEvent.type(input, 'berlin')

    const options = await screen.findAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('Berlin')
    expect(options[0]).toHaveTextContent('State of Berlin, Germany')
    expect(options[1]).toHaveTextContent('New Hampshire, United States')
    // Typing is debounced: one search for the final text, not one per keystroke.
    expect(searchLocations).toHaveBeenCalledTimes(1)
    expect(searchLocations.mock.calls[0]?.[0]).toBe('berlin')
  })

  it('selects a result with the mouse', async () => {
    const { input, onSelect } = setup()
    await userEvent.type(input, 'berlin')
    await userEvent.click((await screen.findAllByRole('option'))[1]!)
    expect(onSelect).toHaveBeenCalledWith(berlinNewHampshire)
    expect(input).toHaveValue('')
  })

  it('supports keyboard selection with arrow keys and Enter', async () => {
    const { input, onSelect } = setup()
    await userEvent.type(input, 'berlin')
    await screen.findAllByRole('option')

    await userEvent.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith(berlinNewHampshire)
  })

  it('wraps around with ArrowUp and Escape clears the text', async () => {
    const { input, onSelect } = setup()
    await userEvent.type(input, 'berlin')
    await screen.findAllByRole('option')

    await userEvent.keyboard('{ArrowUp}{Enter}')
    expect(onSelect).toHaveBeenCalledWith(berlinNewHampshire)

    await userEvent.type(input, 'berlin')
    await userEvent.keyboard('{Escape}')
    expect(input).toHaveValue('')
  })

  it('explains an empty result', async () => {
    const { input } = setup()
    await userEvent.type(input, 'zzzzqq')
    expect(await screen.findByText(/No places found for "zzzzqq"/)).toBeInTheDocument()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('explains a failure and lets the user retry', async () => {
    const searchLocations = vi
      .fn()
      .mockRejectedValueOnce(new WeatherApiError('network', 'down'))
      .mockResolvedValue([berlin])
    const { input } = setup({ searchLocations })

    await userEvent.type(input, 'berlin')
    expect(await screen.findByText(/Can't reach the weather service/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('option')).toHaveTextContent('Berlin')
  })

  it('says only recorded places can be found in snapshot mode', async () => {
    const { input } = setup({ kind: 'snapshot', searchLocations: vi.fn().mockResolvedValue([]) })
    await userEvent.type(input, 'paris')
    expect(
      await screen.findByText(/Only places with recorded data can be found/),
    ).toBeInTheDocument()
  })
})
