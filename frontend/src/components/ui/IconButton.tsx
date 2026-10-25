import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import styles from './IconButton.module.css'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name. Icon-only buttons must always have one. */
  label: string
  icon: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function IconButton({
  label,
  icon,
  type = 'button',
  className,
  ref,
  ...rest
}: IconButtonProps) {
  const classes = [styles.iconButton, className].filter(Boolean).join(' ')
  return (
    <button ref={ref} type={type} className={classes} aria-label={label} title={label} {...rest}>
      <span aria-hidden="true" className={styles.icon}>
        {icon}
      </span>
    </button>
  )
}
