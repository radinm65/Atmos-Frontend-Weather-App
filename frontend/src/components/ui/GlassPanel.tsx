import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { riseIn } from '../motion/variants'
import styles from './GlassPanel.module.css'

export interface GlassPanelProps extends HTMLMotionProps<'div'> {
  /** Render as a landmark-friendly element. */
  as?: 'div' | 'section' | 'article'
  /** More opaque glass, for content that needs extra contrast. */
  strong?: boolean
  /** Lifts on hover and follows the pointer with a light sheen. */
  interactive?: boolean
}

/**
 * A liquid-glass surface: blurred, translucent, with a light edge and a sheen that follows the
 * pointer. Inside a `StaggerGroup` it rises in with its siblings. Motion is dropped for users who
 * prefer reduced motion (see MotionConfig in providers).
 */
export function GlassPanel({
  as = 'div',
  strong = false,
  interactive = true,
  className,
  children,
  onPointerMove,
  ...rest
}: GlassPanelProps) {
  const frame = useRef(0)
  const Tag = as === 'section' ? motion.section : as === 'article' ? motion.article : motion.div

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    onPointerMove?.(event)
    if (!interactive || event.pointerType === 'touch') return
    const target = event.currentTarget
    const { clientX, clientY } = event
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const box = target.getBoundingClientRect()
      target.style.setProperty('--mx', `${((clientX - box.left) / box.width) * 100}%`)
      target.style.setProperty('--my', `${((clientY - box.top) / box.height) * 100}%`)
    })
  }

  const classes = [
    strong ? 'glass-strong' : 'glass',
    styles.panel,
    interactive && styles.interactive,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag
      variants={riseIn}
      whileHover={interactive ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={classes}
      onPointerMove={handlePointerMove}
      {...(rest as HTMLMotionProps<'div'>)}
    >
      {children}
    </Tag>
  )
}
