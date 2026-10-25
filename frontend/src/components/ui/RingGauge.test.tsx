import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RingGauge } from './RingGauge'

describe('RingGauge', () => {
  it('shows its value in the centre as real text', () => {
    render(
      <RingGauge fraction={0.62} color="red" size={132}>
        <span>62%</span>
      </RingGauge>,
    )
    expect(screen.getByText('62%')).toBeInTheDocument()
  })

  it('keeps the ring itself the requested size', () => {
    const { container } = render(<RingGauge fraction={0.5} color="red" size={132} />)
    const ring = container.firstElementChild as HTMLElement
    expect(ring.style.width).toBe('132px')
    expect(ring.style.height).toBe('132px')
  })

  it('draws on layers larger than the ring and offset equally, so the glow has room and the ring stays centred', () => {
    const { container } = render(<RingGauge fraction={0.5} color="red" size={132} />)
    const layers = [...container.querySelectorAll('svg')]
    expect(layers).toHaveLength(2) // track + glowing progress
    for (const layer of layers) {
      const box = Number.parseFloat(layer.style.width)
      const offset = Number.parseFloat(layer.style.left)
      expect(box).toBeGreaterThan(132)
      // Equal room on every side: the layer extends past the ring by the same amount each way.
      expect(offset).toBe(-(box - 132) / 2)
      expect(Number.parseFloat(layer.style.top)).toBe(offset)
      expect(layer.style.height).toBe(layer.style.width)
      expect(layer).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('applies the glow to the progress layer only, not the track', () => {
    const { container } = render(<RingGauge fraction={0.5} color="rgb(1, 2, 3)" />)
    const [track, progress] = [...container.querySelectorAll('svg')]
    expect(track?.style.filter).toBe('')
    expect(progress?.style.filter).toContain('drop-shadow')
  })
})
