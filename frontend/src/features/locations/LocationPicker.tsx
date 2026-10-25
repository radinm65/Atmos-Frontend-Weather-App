import { ChevronDown, MapPin } from 'lucide-react'
import { useCallback, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnchoredPanel } from '../../components/ui/AnchoredPanel'
import type { Location } from '../../domain/location'
import { LocationSearch } from './LocationSearch'
import styles from './LocationPicker.module.css'
import { UseMyLocationButton } from './UseMyLocationButton'
import { useActiveLocation } from './useActiveLocation'

/**
 * Header control: shows the active place and opens a search panel to change it. The panel is an
 * AnchoredPanel (a portal outside the header), so opening it never changes the header's layout.
 */
export function LocationPicker() {
  const panelId = useId()
  const { activeLocation, setActiveLocation } = useActiveLocation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])

  function select(location: Location) {
    setActiveLocation(location)
    setOpen(false)
    triggerRef.current?.focus()
  }

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

      <AnchoredPanel
        open={open}
        onClose={close}
        triggerRef={triggerRef}
        id={panelId}
        label="Choose a location"
      >
        <LocationSearch onSelect={select} focusOnMount />
        <UseMyLocationButton onLocated={select} />
        <Link to="/locations" className={styles.link} onClick={close}>
          Saved locations
        </Link>
      </AnchoredPanel>
    </div>
  )
}
