import type { ReactNode } from 'react'
import { GlassPanel } from '../ui/GlassPanel'
import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  title: string
  description?: ReactNode
  /** Extra content on the right, such as a status chip. */
  children?: ReactNode
}

/**
 * The title of a page, on a glass banner. A bare heading right under the fixed header would be
 * blurred by its shade, and dark text on moving footage is unreadable in the light theme; the
 * glass keeps the title legible over any scene in both themes.
 */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <GlassPanel strong interactive={false} className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {children}
    </GlassPanel>
  )
}
