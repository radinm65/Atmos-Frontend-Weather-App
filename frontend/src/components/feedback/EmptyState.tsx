import type { ReactNode } from 'react'
import styles from './Feedback.module.css'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  /** Optional call to action, e.g. a Button. */
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <section className={styles.state} aria-label={title}>
      {icon ? (
        <div className={styles.stateIcon} aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 className={styles.stateTitle}>{title}</h2>
      {description ? <p className={styles.stateText}>{description}</p> : null}
      {action ? <div className={styles.stateAction}>{action}</div> : null}
    </section>
  )
}
