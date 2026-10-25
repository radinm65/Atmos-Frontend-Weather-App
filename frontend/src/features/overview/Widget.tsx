import type { ComponentType, ReactNode } from 'react'
import { GlassPanel } from '../../components/ui/GlassPanel'
import styles from './Widget.module.css'

export interface WidgetProps {
  title: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>
  children: ReactNode
  /** Plain-language line under the visual. */
  note?: ReactNode
}

/** The shared frame for every dashboard widget: icon + title, a visual, and one line of text. */
export function Widget({ title, icon: Icon, children, note }: WidgetProps) {
  return (
    <GlassPanel as="article" className={styles.widget}>
      <header className={styles.header}>
        <Icon size={17} aria-hidden="true" />
        <h3 className={styles.title}>{title}</h3>
      </header>
      <div className={styles.body}>{children}</div>
      {note ? <p className={styles.note}>{note}</p> : null}
    </GlassPanel>
  )
}
