import { CloudSun } from 'lucide-react'
import { RoutePlaceholder } from '../../components/layout/RoutePlaceholder'

export function OverviewPage() {
  return (
    <RoutePlaceholder
      title="Overview"
      summary="Current conditions, key metrics and forecast highlights for your selected city."
      icon={CloudSun}
    />
  )
}
