import { ChevronDown, MapPin } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Location } from '../../domain/location'
import { LocationSearch } from './LocationSearch'
import styles from './LocationPicker.module.css'
import { UseMyLocationButton } from './UseMyLocationButton'
import { useActiveLocation } from './useActiveLocation'

/** Header control: shows the active place and opens a search panel to change it. */
export function LocationPicker() {
  const panelId = useId()
  const { activeLocation, setActiveLocation } = useActiveLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function select(location: Location) {
    setActiveLocation(location)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className={styles.picker} ref={rootRef}>
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

      {open ? (
        <div
          id={panelId}
          className={`glass-strong ${styles.panel}`}
          role="group"
          aria-label="Choose a location"
        >
          <LocationSearch onSelect={select} focusOnMount />
          <UseMyLocationButton onLocated={select} />
          <Link to="/locations" className={styles.link} onClick={() => setOpen(false)}>
            Saved locations
          </Link>
        </div>
      ) : null}
    </div>
  )
}
