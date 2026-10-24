import { Columns2 } from 'lucide-react'
import { RoutePlaceholder } from '../../components/layout/RoutePlaceholder'

export function ComparePage() {
  return (
    <RoutePlaceholder
      title="Compare"
      summary="Side-by-side weather for several cities."
      icon={Columns2}
    />
  )
}
