import { TriangleAlert } from 'lucide-react'
import { Button } from '../ui/Button'
import styles from './Feedback.module.css'

export interface ErrorStateProps {
  title?: string
  /** Human-readable explanation of what went wrong. */
  message: string
  /** When provided, a retry button is shown. */
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <section className={`${styles.state} ${styles.error}`} role="alert">
      <TriangleAlert className={styles.errorIcon} aria-hidden="true" />
      <h2 className={styles.stateTitle}>{title}</h2>
      <p className={styles.stateText}>{message}</p>
      {onRetry ? (
        <div className={styles.stateAction}>
          <Button onClick={onRetry}>Try again</Button>
        </div>
      ) : null}
    </section>
  )
}
