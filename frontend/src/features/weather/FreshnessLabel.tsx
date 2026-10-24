import { Archive, Clock, TriangleAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import type { WeatherReport } from '../../domain/weather'
import { formatAge, formatDateTime } from '../../lib/formatting'
import styles from './FreshnessLabel.module.css'

export interface FreshnessLabelProps {
  report: WeatherReport
  /** A refresh failed, so the data shown is older than intended. */
  refreshFailed?: boolean
  onRetry?: () => void
}

/**
 * Says how current the data is, in words. Recorded snapshots are always labeled as such and
 * never described as current conditions (AI_RULES §4, TRD §4a).
 */
export function FreshnessLabel({ report, refreshFailed = false, onRetry }: FreshnessLabelProps) {
  const { source, timezone } = report

  if (source.kind === 'snapshot') {
    const capturedAt = source.capturedAt ?? report.fetchedAt
    return (
      <p className={`${styles.label} ${styles.snapshot}`}>
        <Archive size={16} aria-hidden="true" />
        <span>
          <strong>Recorded snapshot</strong> from {formatDateTime(capturedAt, timezone)} ({timezone}
          ). This is saved data, not current conditions.
        </span>
      </p>
    )
  }

  return (
    <div className={styles.group}>
      <p className={styles.label}>
        <Clock size={16} aria-hidden="true" />
        <span>
          Observed {formatDateTime(report.current.observedAt, timezone)} ({timezone}). Updated{' '}
          {formatAge(report.fetchedAt)}.
        </span>
      </p>
      {refreshFailed ? (
        <p role="status" className={`${styles.label} ${styles.stale}`}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span>
            <strong>Out of date.</strong> Couldn&apos;t refresh, so this shows data from{' '}
            {formatAge(report.fetchedAt)}.
          </span>
          {onRetry ? (
            <Button variant="ghost" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
