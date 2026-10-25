import { GlassPanel } from '../../components/ui/GlassPanel'
import { StaggerGroup } from '../../components/motion/StaggerGroup'
import styles from './OverviewSkeleton.module.css'

/** Glass placeholders with the same footprint as the dashboard, so nothing jumps when data lands. */
export function OverviewSkeleton({ placeName }: { placeName: string }) {
  return (
    <StaggerGroup className={styles.page} role="status" aria-live="polite">
      <span className="visually-hidden">Loading weather for {placeName}</span>
      <GlassPanel
        strong
        interactive={false}
        className={`${styles.block} ${styles.hero}`}
        aria-hidden="true"
      />
      <GlassPanel
        interactive={false}
        className={`${styles.block} ${styles.strip}`}
        aria-hidden="true"
      />
      <div className={styles.widgets} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <GlassPanel
            key={index}
            interactive={false}
            className={`${styles.block} ${styles.widget}`}
          />
        ))}
      </div>
    </StaggerGroup>
  )
}
