import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import styles from './ButtonLink.module.css'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'lg'
  endIcon?: ReactNode
}

/** Native action button with the same visual contract as ButtonLink. */
export function Button({ children, variant = 'primary', size = 'md', endIcon,
  className, type = 'button', ...props }: ButtonProps) {
  return (
    <button {...props} type={type} data-cursor-surface=""
      className={[styles.buttonLink, styles[variant], styles[size], className]
        .filter(Boolean).join(' ')}>
      <span className={styles.label}>{children}</span>
      {endIcon != null && <span className={styles.icon} aria-hidden="true">{endIcon}</span>}
    </button>
  )
}
