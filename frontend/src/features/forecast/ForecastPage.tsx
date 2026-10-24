import { CalendarDays } from 'lucide-react'
import { RoutePlaceholder } from '../../components/layout/RoutePlaceholder'

export function ForecastPage() {
  return (
    <RoutePlaceholder
      title="Forecast"
      summary="Detailed hourly and multi-day forecasts."
      icon={CalendarDays}
    />
  )
}
