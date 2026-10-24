import type { LucideIcon } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { EmptyState } from '../feedback/EmptyState'
import styles from './RoutePlaceholder.module.css'

export interface RoutePlaceholderProps {
  title: string
  /** What this page will show once its feature is built. */
  summary: string
  icon: LucideIcon
}

/** Intentional shell for a route whose feature has not been built yet. Shows no weather data. */
export function RoutePlaceholder({ title, summary, icon: Icon }: RoutePlaceholderProps) {
  useDocumentTitle(title)
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{title}</h1>
      <EmptyState
        icon={<Icon size={32} />}
        title="Coming soon"
        description={`${summary} This page is a placeholder while Atmos is being built.`}
      />
    </div>
  )
}
