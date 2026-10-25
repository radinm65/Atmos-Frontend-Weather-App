import { Plus } from 'lucide-react'
import { useState } from 'react'
import { GlassPanel } from '../../components/ui/GlassPanel'
import type { Location } from '../../domain/location'
import { LocationSearch } from '../locations/LocationSearch'
import { useActiveLocation } from '../locations/useActiveLocation'
import { useSavedLocations } from '../locations/useSavedLocations'
import styles from './AddCities.module.css'
import { MIN_COMPARED } from './comparisonStorage'
import { useComparison } from './useComparison'

/** Choose the cities to compare: search, or add the current and saved places with one tap. */
export function AddCities() {
  const { cities, max, has, add } = useComparison()
  const { activeLocation } = useActiveLocation()
  const { saved } = useSavedLocations()
  const [message, setMessage] = useState('')

  const full = cities.length >= max
  const candidates = [activeLocation, ...saved].filter((place): place is Location => place !== null)
  const suggestions = candidates
    .filter((place, index) => candidates.findIndex((other) => other.id === place.id) === index)
    .filter((place) => !has(place.id))

  function addCity(location: Location) {
    const result = add(location)
    setMessage(
      result === 'added'
        ? `Added ${location.name} to the comparison.`
        : result === 'already-added'
          ? `${location.name} is already in the comparison.`
          : `The comparison is full (${max} cities). Remove one to add ${location.name}.`,
    )
  }

  return (
    <GlassPanel
      as="section"
      strong
      interactive={false}
      className={styles.panel}
      aria-labelledby="add-title"
    >
      <div className={styles.top}>
        <h2 id="add-title" className={styles.title}>
          Cities to compare
        </h2>
        <p className={styles.count}>
          {cities.length} of {max}
        </p>
      </div>

      {full ? (
        <p className={styles.note}>
          You are comparing the most cities allowed ({max}). Remove one to add another.
        </p>
      ) : (
        <LocationSearch onSelect={addCity} />
      )}

      {!full && suggestions.length > 0 ? (
        <div className={styles.quick}>
          <span className={styles.quickLabel}>Quick add</span>
          <ul className={styles.quickList}>
            {suggestions.slice(0, 8).map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className={styles.quickButton}
                  aria-label={`Add ${place.name} to the comparison`}
                  onClick={() => addCity(place)}
                >
                  <Plus size={14} aria-hidden="true" />
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {cities.length < MIN_COMPARED ? (
        <p className={styles.hint}>
          {cities.length === 0
            ? `Choose at least ${MIN_COMPARED} cities (up to ${max}) to compare them side by side.`
            : `Add at least ${MIN_COMPARED - cities.length} more ${MIN_COMPARED - cities.length === 1 ? 'city' : 'cities'} to compare.`}
        </p>
      ) : null}

      <p role="status" aria-live="polite" className={styles.message}>
        {message}
      </p>
    </GlassPanel>
  )
}
