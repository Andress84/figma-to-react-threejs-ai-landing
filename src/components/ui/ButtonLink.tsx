import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import styles from './ButtonLink.module.css'

export type ButtonLinkProps = Omit<
  ComponentPropsWithoutRef<'a'>,
  'href' | 'children'
> & {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  /** Decorative trailing icon; the visible children provide the link label. */
  endIcon?: ReactNode
}

/** A navigation link styled as a button. Use a native button for actions. */
export function ButtonLink({
  href,
  children,
  variant = 'primary',
  endIcon,
  className,
  target,
  rel,
  ...props
}: ButtonLinkProps) {
  const linkRel =
    target === '_blank'
      ? [rel, 'noopener', 'noreferrer'].filter(Boolean).join(' ')
      : rel

  return (
    <a
      {...props}
      href={href}
      target={target}
      rel={linkRel}
      className={[styles.buttonLink, styles[variant], className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.label}>{children}</span>
      {endIcon != null && (
        <span className={styles.icon} aria-hidden="true">
          {endIcon}
        </span>
      )}
    </a>
  )
}
