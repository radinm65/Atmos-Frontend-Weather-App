import { SlidersHorizontal } from 'lucide-react'
import { useCallback, useId, useRef, useState } from 'react'
import { AnchoredPanel } from '../../components/ui/AnchoredPanel'
import { IconButton } from '../../components/ui/IconButton'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import type { SegmentOption } from '../../components/ui/SegmentedControl'
import type { TemperatureUnit, WindSpeedUnit } from '../../lib/formatting'
import styles from './UnitsMenu.module.css'
import { usePreferences } from './usePreferences'

const TEMPERATURE: readonly SegmentOption<TemperatureUnit>[] = [
  { id: 'c', label: '°C' },
  { id: 'f', label: '°F' },
]

const WIND: readonly SegmentOption<WindSpeedUnit>[] = [
  { id: 'kmh', label: 'km/h' },
  { id: 'mph', label: 'mph' },
]

/** Header control for the display units. Values are stored metric; this only changes how they show. */
export function UnitsMenu() {
  const panelId = useId()
  const { units, setTemperatureUnit, setWindSpeedUnit } = usePreferences()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])

  const summary = `${units.temperature === 'f' ? '°F' : '°C'} and ${units.windSpeed === 'mph' ? 'mph' : 'km/h'}`

  return (
    <>
      <IconButton
        ref={triggerRef}
        label={`Units: ${summary}`}
        icon={<SlidersHorizontal size={20} />}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      />
      <AnchoredPanel open={open} onClose={close} triggerRef={triggerRef} id={panelId} label="Units">
        <div className={styles.group}>
          <span className={styles.label}>Temperature</span>
          <SegmentedControl
            label="Temperature unit"
            options={TEMPERATURE}
            value={units.temperature}
            onChange={setTemperatureUnit}
          />
        </div>
        <div className={styles.group}>
          <span className={styles.label}>Wind speed</span>
          <SegmentedControl
            label="Wind speed unit"
            options={WIND}
            value={units.windSpeed}
            onChange={setWindSpeedUnit}
          />
        </div>
        <p className={styles.note}>Saved in this browser. Charts and tables update too.</p>
      </AnchoredPanel>
    </>
  )
}
