import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import type { Location } from '../../domain/location'
import { useSavedLocations } from './useSavedLocations'

/** Toggles whether a place is in the user's saved list. */
export function SaveLocationButton({ location }: { location: Location }) {
  const { isSaved, save, remove, saved, maxSaved } = useSavedLocations()
  const alreadySaved = isSaved(location.id)
  const full = !alreadySaved && saved.length >= maxSaved

  return (
    <Button
      variant="secondary"
      aria-pressed={alreadySaved}
      // The accessible name starts with the visible word, as label-in-name requires.
      aria-label={
        alreadySaved
          ? `Saved. Remove ${location.name} from saved locations`
          : `Save ${location.name}`
      }
      disabled={full}
      title={
        full ? `Your saved list is full (${maxSaved}). Remove a place to save another.` : undefined
      }
      onClick={() => (alreadySaved ? remove(location.id) : save(location))}
    >
      {alreadySaved ? (
        <BookmarkCheck size={18} aria-hidden="true" />
      ) : (
        <Bookmark size={18} aria-hidden="true" />
      )}
      {alreadySaved ? 'Saved' : 'Save'}
    </Button>
  )
}
