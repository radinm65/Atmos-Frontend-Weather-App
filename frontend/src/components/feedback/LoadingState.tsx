import styles from './Feedback.module.css'

export interface LoadingStateProps {
  /** Text announced to assistive technology. */
  label?: string
  /** Number of skeleton lines; fixed heights keep the layout stable while loading. */
  lines?: number
}

export function LoadingState({ label = 'Loading', lines = 3 }: LoadingStateProps) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      <div aria-hidden="true" className={styles.skeletonGroup}>
        {Array.from({ length: lines }, (_, index) => (
          <div key={index} className={styles.skeleton} />
        ))}
      </div>
    </div>
  )
}
