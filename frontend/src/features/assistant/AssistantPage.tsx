import { Sparkles } from 'lucide-react'
import { RoutePlaceholder } from '../../components/layout/RoutePlaceholder'

export function AssistantPage() {
  return (
    <RoutePlaceholder
      title="Assistant"
      summary="Ask plain-language questions about the weather for your selected city."
      icon={Sparkles}
    />
  )
}
