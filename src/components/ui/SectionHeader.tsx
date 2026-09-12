import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import styles from './SectionHeader.module.css'

export type SectionHeaderProps = Omit<
  ComponentPropsWithoutRef<'header'>,
  'title' | 'children'
> & {
  headingId: string
  title: ReactNode
  description: ReactNode
  align?: 'start' | 'center'
}

/** Place inside a section whose aria-labelledby matches headingId. */
export function SectionHeader({
  headingId,
  title,
  description,
  align = 'start',
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <header
      {...props}
      className={[styles.sectionHeader, styles[align], className]
        .filter(Boolean)
        .join(' ')}
    >
      <h2 id={headingId} className={styles.title}>
        {title}
      </h2>
      <p className={styles.description}>{description}</p>
    </header>
  )
}
