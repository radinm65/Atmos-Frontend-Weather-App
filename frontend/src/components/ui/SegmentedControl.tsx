import { motion } from 'motion/react'
import { useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import styles from './SegmentedControl.module.css'

export interface SegmentOption<T extends string> {
  id: T
  label: string
  icon?: ReactNode
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible name for the group. */
  label: string
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * A pill-shaped single choice (radio group) with a sliding glass indicator. Arrow keys move the
 * selection, as radio groups do; only the selected option is in the tab order.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const groupId = useId()
  const refs = useRef(new Map<T, HTMLButtonElement>())

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((option) => option.id === value)
    let next = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % options.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = (index - 1 + options.length) % options.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = options.length - 1
    else return
    event.preventDefault()
    const target = options[next]
    if (target) {
      onChange(target.id)
      refs.current.get(target.id)?.focus()
    }
  }

  return (
    // Keys are handled on the group, but focus lives on the radios (roving tabindex), which is
    // the standard radio-group pattern; the group element itself is deliberately not focusable.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div className={styles.group} role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {options.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            ref={(element) => {
              if (element) refs.current.set(option.id, element)
              else refs.current.delete(option.id)
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.option} ${selected ? styles.selected : ''}`}
            onClick={() => onChange(option.id)}
          >
            {selected ? (
              <motion.span
                layoutId={`segment-${groupId}`}
                className={styles.indicator}
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              />
            ) : null}
            {option.icon ? (
              <span className={styles.icon} aria-hidden="true">
                {option.icon}
              </span>
            ) : null}
            <span className={styles.text}>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
