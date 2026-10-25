import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const OPTIONS = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
] as const

function Harness() {
  const [value, setValue] = useState<'a' | 'b' | 'c'>('a')
  return <SegmentedControl label="Letters" options={OPTIONS} value={value} onChange={setValue} />
}

describe('SegmentedControl', () => {
  it('is a labelled radio group with one selected option', () => {
    render(<Harness />)
    const group = screen.getByRole('radiogroup', { name: 'Letters' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Beta' })).not.toBeChecked()
  })

  it('selects with a click', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('radio', { name: 'Gamma' }))
    expect(screen.getByRole('radio', { name: 'Gamma' })).toBeChecked()
  })

  it('only puts the selected option in the tab order (roving tabindex)', () => {
    render(<Harness />)
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves the selection and focus with the arrow keys, wrapping around', async () => {
    render(<Harness />)
    screen.getByRole('radio', { name: 'Alpha' }).focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Gamma' })).toBeChecked()

    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked()
  })

  it('jumps to the first and last option with Home and End', async () => {
    render(<Harness />)
    screen.getByRole('radio', { name: 'Alpha' }).focus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('radio', { name: 'Gamma' })).toBeChecked()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked()
  })
})
