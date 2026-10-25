import type { LucideIcon } from 'lucide-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { GlassPanel } from '../ui/GlassPanel'
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
      <GlassPanel
        as="section"
        strong
        interactive={false}
        initial="hidden"
        animate="visible"
        className={styles.card}
        aria-label="Coming soon"
      >
        <Icon size={44} aria-hidden="true" className={styles.icon} />
        <h2 className={styles.cardTitle}>Coming soon</h2>
        <p className={styles.text}>
          {summary} This page is a placeholder while Atmos is being built.
        </p>
      </GlassPanel>
    </div>
  )
}
