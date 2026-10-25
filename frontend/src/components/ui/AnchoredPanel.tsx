import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import styles from './AnchoredPanel.module.css'

const GAP_PX = 12

interface Anchor {
  top: number
  right: number
}

export interface AnchoredPanelProps {
  open: boolean
  /** Called for Escape and for clicks outside the panel and its trigger. */
  onClose: () => void
  /** The button that opens the panel; clicks on it are not "outside", and Escape refocuses it. */
  triggerRef: RefObject<HTMLElement | null>
  id: string
  /** Accessible name for the panel. */
  label: string
  children: ReactNode
}

/**
 * A glass pop-up positioned under its trigger. It is rendered in a portal on <body>, so it is
 * completely outside the header and can never change the header's height or layout. On phones it
 * spans the screen width. The position is measured from the trigger before paint.
 */
export function AnchoredPanel({
  open,
  onClose,
  triggerRef,
  id,
  label,
  children,
}: AnchoredPanelProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const measure = useCallback(() => {
    const box = triggerRef.current?.getBoundingClientRect()
    if (box) setAnchor({ top: box.bottom + GAP_PX, right: window.innerWidth - box.right })
  }, [triggerRef])

  useLayoutEffect(() => {
    if (open) measure()
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, measure, onClose, triggerRef])

  if (!open || !anchor) return null

  const style = {
    '--panel-top': `${anchor.top}px`,
    '--panel-right': `${anchor.right}px`,
  } as CSSProperties

  return createPortal(
    <div
      ref={panelRef}
      id={id}
      className={`glass-strong ${styles.panel}`}
      style={style}
      role="group"
      aria-label={label}
    >
      {children}
    </div>,
    document.body,
  )
}
