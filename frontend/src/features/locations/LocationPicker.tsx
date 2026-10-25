import { ChevronDown, MapPin } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { Location } from '../../domain/location'
import { LocationSearch } from './LocationSearch'
import styles from './LocationPicker.module.css'
import { UseMyLocationButton } from './UseMyLocationButton'
import { useActiveLocation } from './useActiveLocation'

const GAP_PX = 12

interface Anchor {
  top: number
  right: number
}

/**
 * Header control: shows the active place and opens a search panel to change it. The panel is
 * rendered in a portal on <body>, outside the header, so opening it never changes the header's
 * height or layout.
 */
export function LocationPicker() {
  const panelId = useId()
  const { activeLocation, setActiveLocation } = useActiveLocation()
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const measure = useCallback(() => {
    const box = triggerRef.current?.getBoundingClientRect()
    if (box) setAnchor({ top: box.bottom + GAP_PX, right: window.innerWidth - box.right })
  }, [])

  // Measure before paint, so the panel never flashes in the wrong place.
  useLayoutEffect(() => {
    if (open) measure()
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, measure])

  function select(location: Location) {
    setActiveLocation(location)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const panelStyle = anchor
    ? ({
        '--picker-top': `${anchor.top}px`,
        '--picker-right': `${anchor.right}px`,
      } as CSSProperties)
    : undefined

  return (
    <div className={styles.picker}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <MapPin size={16} aria-hidden="true" />
        <span className={styles.triggerText}>{activeLocation?.name ?? 'Choose location'}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open && anchor
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              className={`glass-strong ${styles.panel}`}
              style={panelStyle}
              role="group"
              aria-label="Choose a location"
            >
              <LocationSearch onSelect={select} focusOnMount />
              <UseMyLocationButton onLocated={select} />
              <Link to="/locations" className={styles.link} onClick={() => setOpen(false)}>
                Saved locations
              </Link>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
