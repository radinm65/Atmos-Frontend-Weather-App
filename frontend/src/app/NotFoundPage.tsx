import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <EmptyState
      icon={<SearchX size={32} />}
      title="Page not found"
      description="That page doesn't exist."
      action={<Link to="/">Back to Overview</Link>}
    />
  )
}
