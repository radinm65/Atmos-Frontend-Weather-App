import { Bookmark } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { StaggerGroup } from '../../components/motion/StaggerGroup'
import { GlassPanel } from '../../components/ui/GlassPanel'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { Location } from '../../domain/location'
import { LocationSearch } from './LocationSearch'
import { SavedLocationCard } from './SavedLocationCard'
import styles from './LocationsPage.module.css'
import { useActiveLocation } from './useActiveLocation'
import { useSavedLocations } from './useSavedLocations'

export function LocationsPage() {
  useDocumentTitle('Locations')
  const navigate = useNavigate()
  const { activeLocation, setActiveLocation } = useActiveLocation()
  const { saved, maxSaved, save, remove } = useSavedLocations()
  const full = saved.length >= maxSaved

  function view(location: Location) {
    setActiveLocation(location)
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Locations"
        description="Your saved places, each with its current weather."
      />

      <GlassPanel
        as="section"
        strong
        interactive={false}
        className={styles.add}
        aria-label="Add a place"
      >
        <h2 className={styles.addTitle}>Add a place</h2>
        {full ? (
          <p className={styles.note}>
            Your saved list is full ({maxSaved}). Remove a place to add another.
          </p>
        ) : (
          <LocationSearch onSelect={(location) => save(location)} />
        )}
        <p className={styles.note}>
          Saved places are kept in this browser only. They do not sync to other devices and are lost
          if you clear this site&apos;s data.
        </p>
      </GlassPanel>

      {saved.length === 0 ? (
        <GlassPanel
          as="section"
          interactive={false}
          className={styles.empty}
          aria-label="No saved locations"
        >
          <Bookmark size={40} aria-hidden="true" className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No saved locations yet</h2>
          <p className={styles.note}>
            Search for a city above, or open a city&apos;s weather and press Save. Saved places
            appear here with their current weather, and in the location menu for quick switching.
          </p>
        </GlassPanel>
      ) : (
        <StaggerGroup className={styles.grid} aria-label={`${saved.length} saved locations`}>
          {saved.map((location) => (
            <SavedLocationCard
              key={location.id}
              location={location}
              active={activeLocation?.id === location.id}
              onView={() => view(location)}
              onRemove={() => remove(location.id)}
            />
          ))}
        </StaggerGroup>
      )}
    </div>
  )
}
