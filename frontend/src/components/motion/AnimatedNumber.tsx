import { animate } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export interface AnimatedNumberProps {
  value: number
  /** Formats the number for display, e.g. `(n) => `${Math.round(n)}°``. */
  format: (value: number) => string
  durationS?: number
}

/**
 * Counts smoothly from the previous value to the new one. The final formatted value is always in
 * the DOM for assistive technology and tests (the counting text is hidden from them), so a screen
 * reader never announces intermediate numbers.
 */
export function AnimatedNumber({ value, format, durationS = 0.9 }: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion()
  const [shown, setShown] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    if (reducedMotion || previous.current === value) {
      previous.current = value
      setShown(value)
      return
    }
    const controls = animate(previous.current, value, {
      duration: durationS,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setShown,
      onComplete: () => {
        previous.current = value
      },
    })
    return () => {
      previous.current = shown
      controls.stop()
    }
    // `shown` is deliberately not a dependency: it changes on every animation frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationS, reducedMotion])

  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="visually-hidden">{format(value)}</span>
    </>
  )
}
