import { Bookmark } from 'lucide-react'
import { RoutePlaceholder } from '../../components/layout/RoutePlaceholder'

export function LocationsPage() {
  return (
    <RoutePlaceholder
      title="Locations"
      summary="Save and manage your favorite cities."
      icon={Bookmark}
    />
  )
}
